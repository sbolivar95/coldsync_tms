import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { Product } from '../../../types/database.types'
import { productsService, productThermalProfilesService } from '../../../services/database'
import { useAppStore } from '../../../stores/useAppStore'

/**
 * Custom hook for managing products state and operations
 * Uses Zustand store for shared state between components (similar to useUsers)
 */
export function useProducts(orgId: string) {
  const navigate = useNavigate()
  
  // Use Zustand store for products (shared state)
  const products = useAppStore((state) => state.products)
  const isLoading = useAppStore((state) => state.productsLoading)
  const productsLoadedOrgId = useAppStore((state) => state.productsLoadedOrgId)
  const setProducts = useAppStore((state) => state.setProducts)
  const setProductsLoading = useAppStore((state) => state.setProductsLoading)
  const setProductsLoadedOrgId = useAppStore((state) => state.setProductsLoadedOrgId)

  // Local state for dialogs and UI (not shared)
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined)
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [productThermalProfileIds, setProductThermalProfileIds] = useState<number[]>([])

  // Confirmation dialogs state
  const [deleteProductDialogOpen, setDeleteProductDialogOpen] = useState(false)
  const [bulkDeleteProductDialogOpen, setBulkDeleteProductDialogOpen] = useState(false)
  const [productToAction, setProductToAction] = useState<Product | undefined>(undefined)
  const [productsToDelete, setProductsToDelete] = useState<string[]>([])

  // Load products data with intelligent caching
  const loadProducts = async (force = false) => {
    if (!orgId) {
      setProducts([])
      setProductsLoadedOrgId(null)
      return
    }

    // Skip if already loaded for this orgId and not forcing reload
    if (!force && productsLoadedOrgId === orgId && products.length > 0) {
      return
    }

    try {
      setProductsLoading(true)
      const data = await productsService.getAll(orgId)
      setProducts(data)
      setProductsLoadedOrgId(orgId)
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Error al cargar los productos')
      setProducts([])
      setProductsLoadedOrgId(null)
    } finally {
      setProductsLoading(false)
    }
  }

  // Load thermal profiles for product dialog when editing
  const loadProductThermalProfiles = async (productId: number) => {
    if (!orgId) return []

    try {
      const links = await productThermalProfilesService.getByProductId(productId, orgId)
      return links.map((link) => link.thermal_profile_id)
    } catch (error) {
      console.error('Error loading product thermal profiles:', error)
      return []
    }
  }

  // Handlers
  const handleProductEdit = async (product: Product) => {
    // Pre-load thermal profiles BEFORE opening dialog to avoid checkbox flicker
    if (orgId) {
      const profileIds = await loadProductThermalProfiles(product.id)
      setProductThermalProfileIds(profileIds)
    }
    
    setSelectedProduct(product)
    setProductDialogOpen(true)
  }

  const handleProductEditById = useCallback((productId: string) => {
    const product = products.find(p => p.id.toString() === productId)
    if (product) {
      handleProductEdit(product)
    }
  }, [products])

  const handleProductDelete = (product: Product) => {
    setProductToAction(product)
    setDeleteProductDialogOpen(true)
  }

  const handleConfirmDeleteProduct = async () => {
    if (!productToAction || !orgId) {
      toast.error('Error: producto u organización no válidos')
      return
    }

    try {
      await productsService.softDelete(productToAction.id, orgId)
      toast.success(`Producto ${productToAction.name} eliminado correctamente`)
      loadProducts(true) // Force reload after delete
    } catch (error) {
      console.error('Error eliminando producto:', error)
      toast.error('Error al eliminar el producto')
    } finally {
      setDeleteProductDialogOpen(false)
      setProductToAction(undefined)
    }
  }

  const handleProductReactivate = async (product: Product) => {
    if (!orgId) {
      toast.error('No hay organización seleccionada')
      return
    }

    try {
      await productsService.reactivate(product.id, orgId)
      toast.success('Producto reactivado correctamente')
      loadProducts(true) // Force reload after reactivate
    } catch (error) {
      console.error('Error reactivando producto:', error)
      toast.error('Error al reactivar el producto')
    }
  }

  const handleProductBulkDelete = (productIds: string[]) => {
    setProductsToDelete(productIds)
    setBulkDeleteProductDialogOpen(true)
  }

  const handleConfirmBulkDeleteProduct = async () => {
    if (!orgId) {
      toast.error('No hay organización seleccionada')
      setBulkDeleteProductDialogOpen(false)
      setProductsToDelete([])
      return
    }

    if (productsToDelete.length === 0) {
      setBulkDeleteProductDialogOpen(false)
      setProductsToDelete([])
      return
    }

    try {
      await Promise.all(
        productsToDelete.map((id) => productsService.softDelete(Number(id), orgId))
      )
      toast.success(`${productsToDelete.length} producto(s) eliminado(s) correctamente`)
      loadProducts(true) // Force reload after bulk delete
    } catch (error) {
      console.error('Error eliminando productos:', error)
      toast.error('Error al eliminar los productos')
    } finally {
      setBulkDeleteProductDialogOpen(false)
      setProductsToDelete([])
    }
  }

  const handleProductSave = async (
    productData: Omit<Product, 'id' | 'org_id' | 'created_at' | 'updated_at'> & { thermalProfileIds: number[] }
  ) => {
    if (!orgId) {
      toast.error('No hay organización seleccionada')
      return
    }

    try {
      const { thermalProfileIds, ...productInsert } = productData

      if (selectedProduct) {
        // Update existing product
        await productsService.update(selectedProduct.id, orgId, productInsert)
        
        // Update thermal profile relationships
        await productThermalProfilesService.replaceForProduct(
          selectedProduct.id,
          orgId,
          thermalProfileIds
        )
        
        toast.success('Producto actualizado correctamente')
      } else {
        // Create new product
        const newProduct = await productsService.create({
          ...productInsert,
          org_id: orgId,
        })

        // Link thermal profiles
        if (thermalProfileIds.length > 0) {
          await productThermalProfilesService.replaceForProduct(
            newProduct.id,
            orgId,
            thermalProfileIds
          )
        }

        toast.success('Producto creado correctamente')
      }

      setProductDialogOpen(false)
      setSelectedProduct(undefined)
      loadProducts(true) // Force reload after save
    } catch (error) {
      console.error('Error guardando producto:', error)
      toast.error('Error al guardar el producto')
    }
  }

  const handleProductCreate = () => {
    setSelectedProduct(undefined)
    setProductThermalProfileIds([]) // Clear for new product
    setProductDialogOpen(true)
  }

  const handleProductDialogClose = () => {
    setProductDialogOpen(false)
    setSelectedProduct(undefined)
    setProductThermalProfileIds([])
    // Regresar a la ruta base si estamos en una sub-ruta
    if (window.location.pathname.includes('/settings/products/')) {
      navigate('/settings/products')
    }
  }

  // Load thermal profiles when product dialog opens for editing (REMOVED - now pre-loaded)
  // This useEffect was causing checkbox flicker - data is now pre-loaded in handleProductEdit
  useEffect(() => {
    // Only clear thermal profiles when dialog closes or product changes to undefined
    if (!productDialogOpen || !selectedProduct) {
      setProductThermalProfileIds([])
    }
  }, [productDialogOpen, selectedProduct])

  // Load products only when orgId changes (not on every mount)
  useEffect(() => {
    // Only load if orgId changed or hasn't been loaded yet
    if (orgId && (productsLoadedOrgId !== orgId || products.length === 0)) {
      loadProducts()
    } else if (!orgId) {
      setProducts([])
      setProductsLoadedOrgId(null)
    }
  }, [orgId, productsLoadedOrgId, products.length])

  return {
    // Data
    products,
    isLoading,

    // State
    selectedProduct,
    productDialogOpen,
    productThermalProfileIds,
    deleteProductDialogOpen,
    bulkDeleteProductDialogOpen,
    productToAction,
    productsToDelete,
    
    // Actions
    handleProductEdit,
    handleProductEditById,
    handleProductDelete,
    handleConfirmDeleteProduct,
    handleProductReactivate,
    handleProductBulkDelete,
    handleConfirmBulkDeleteProduct,
    handleProductSave,
    handleProductCreate,
    handleProductDialogClose,
    loadProducts,
    setDeleteProductDialogOpen,
    setBulkDeleteProductDialogOpen,
  }
}