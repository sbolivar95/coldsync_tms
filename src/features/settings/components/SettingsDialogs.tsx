import { ConfirmDialog } from '../../../components/widgets/ConfirmDialog'

import { UserDialog } from '../entities/users/UserDialog'
import { UserInvitationSendDialog } from '../entities/users/UserInvitationSendDialog'
import { ProductDialog } from '../entities/products/ProductDialog'
import { ThermalProfileDialog } from '../entities/thermal_profiles/ThermalProfileDialog'
import { RateCardBatchDuplicateDialog } from '../entities/rate_cards/RateCardBatchDuplicateDialog'
import type { useOrganizations } from '../hooks/useOrganizations'
import type { useProducts } from '../hooks/useProducts'
import type { useThermalProfiles } from '../hooks/useThermalProfiles'
import type { useUsers } from '../hooks/useUsers'
import type { useRateCards } from '../hooks/useRateCards'
import { useAppStore } from '../../../stores/useAppStore'

interface SettingsDialogsProps {
  isPlatformUser: boolean
  orgId: string
  organizations: ReturnType<typeof useOrganizations>
  users: ReturnType<typeof useUsers>
  products: ReturnType<typeof useProducts>
  thermalProfiles: ReturnType<typeof useThermalProfiles>
  rateCards: ReturnType<typeof useRateCards>
}

/**
 * SettingsDialogs - Component that renders all dialogs for the Settings page
 * Extracted to reduce the size of Settings.tsx
 */
export function SettingsDialogs({
  isPlatformUser,
  orgId,
  organizations,
  users,
  products,
  thermalProfiles,
  rateCards,
}: SettingsDialogsProps) {
  const organization = useAppStore((state) => state.organization)

  return (
    <>


      <UserDialog
        open={users.userDialogOpen}
        onClose={users.handleUserDialogClose}
        user={users.selectedUser}
        organizations={organizations.organizations.map((org) => ({
          ...org,
          city: org.city ?? undefined,
        })) as import('../../../lib/mockData').Organization[]}
        onSave={users.handleUserSave}
        isPlatformUser={isPlatformUser}
        currentOrgId={orgId}
        step={users.userDialogStep}
        credentials={users.createdCredentials ? {
          email: users.createdCredentials.email,
          password: users.createdCredentials.password
        } : undefined}
        onBackToForm={() => users.handleUserCreate()}
      />

      <UserInvitationSendDialog
        open={users.userInvitationSendDialogOpen}
        onClose={users.handleUserInvitationSendDialogClose}
        onSendInvitation={users.handleUserInvitationSubmit}
        currentOrgId={orgId}
        isPlatformUser={isPlatformUser}
      />



      <ProductDialog
        open={products.productDialogOpen}
        onClose={products.handleProductDialogClose}
        product={products.selectedProduct}
        thermalProfiles={thermalProfiles.thermalProfiles}
        productThermalProfileIds={products.productThermalProfileIds}
        onSave={products.handleProductSave}
      />

      <ThermalProfileDialog
        open={thermalProfiles.thermalProfileDialogOpen}
        onClose={thermalProfiles.handleThermalProfileDialogClose}
        profile={thermalProfiles.selectedThermalProfile}
        products={products.products}
        onSave={thermalProfiles.handleThermalProfileSave}
      />

      {rateCards.rateCardToBatchDuplicate && (
        <RateCardBatchDuplicateDialog
          open={rateCards.batchDuplicateDialogOpen}
          onClose={rateCards.handleCloseBatchDuplicateDialog}
          sourceRateCard={rateCards.rateCardToBatchDuplicate}
          sourceThermalModifiers={rateCards.sourceThermalModifiers}
          lanes={rateCards.lanes}
          carriers={rateCards.carriers}
          onConfirm={rateCards.handleBatchDuplicate}
        />
      )}

      {/* Confirmation Dialogs for User Actions */}
      <ConfirmDialog
        open={users.suspendUserDialogOpen}
        onOpenChange={users.setSuspendUserDialogOpen}
        title="Suspender Usuario"
        description={
          users.userToAction ? (
            <>
              ¿Estás seguro de que deseas suspender a{' '}
              <strong>
                {users.userToAction.firstName} {users.userToAction.lastName}
              </strong>
              ?. Su acceso sera restringido.
            </>
          ) : (
            '¿Estás seguro de que deseas suspender este usuario?. Su acceso sera restringido.'
          )
        }
        confirmText="Sí, suspender"
        cancelText="Cancelar"
        variant="warning"
        onConfirm={users.handleConfirmSuspendUser}
      />

      <ConfirmDialog
        open={users.reactivateUserDialogOpen}
        onOpenChange={users.setReactivateUserDialogOpen}
        title="Reactivar Usuario"
        description={
          users.userToAction ? (
            <>
              ¿Estás seguro de que deseas reactivar a{' '}
              <strong>
                {users.userToAction.firstName} {users.userToAction.lastName}
              </strong>
              ?
              <br />
              <br />
              El usuario podrá acceder al sistema nuevamente.
            </>
          ) : (
            '¿Estás seguro de que deseas reactivar este usuario?'
          )
        }
        confirmText="Sí, reactivar"
        cancelText="Cancelar"
        variant="default"
        onConfirm={users.handleConfirmReactivateUser}
      />

      <ConfirmDialog
        open={users.deleteUserDialogOpen}
        onOpenChange={users.setDeleteUserDialogOpen}
        title="Eliminar Usuario"
        description={
          users.userToAction ? (
            <>
              ¿Estás seguro de que deseas eliminar a{' '}
              <strong>
                {users.userToAction.firstName} {users.userToAction.lastName}
              </strong>
              ?. El usuario no podrá acceder al sistema.
            </>
          ) : (
            '¿Estás seguro de que deseas eliminar este usuario?. El usuario no podrá acceder al sistema.'
          )
        }
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={users.handleConfirmDeleteUser}
      />

      <ConfirmDialog
        open={users.bulkDeleteUserDialogOpen}
        onOpenChange={users.setBulkDeleteUserDialogOpen}
        title="Eliminar Usuarios"
        description={
          users.usersToDelete && users.usersToDelete.length > 0 ? (
            <>
              ¿Estás seguro de que deseas eliminar {users.usersToDelete.length} usuario(s)
              seleccionado(s)? Los usuarios no podrán acceder al sistema.
            </>
          ) : (
            '¿Estás seguro de que deseas eliminar los usuarios seleccionados? Los usuarios no podrán acceder al sistema.'
          )
        }
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={users.handleConfirmBulkDeleteUser}
      />

      {/* Confirmation Dialogs for Thermal Profile Actions */}
      <ConfirmDialog
        open={thermalProfiles.deleteThermalProfileDialogOpen}
        onOpenChange={thermalProfiles.setDeleteThermalProfileDialogOpen}
        title="Eliminar Perfil Térmico"
        description={
          thermalProfiles.thermalProfileToAction ? (
            <>
              ¿Estás seguro de que deseas eliminar el perfil térmico{' '}
              <strong>{thermalProfiles.thermalProfileToAction.name}</strong>?
            </>
          ) : (
            '¿Estás seguro de que deseas eliminar este perfil térmico?'
          )
        }
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={thermalProfiles.handleConfirmDeleteThermalProfile}
      />

      <ConfirmDialog
        open={thermalProfiles.bulkDeleteThermalProfileDialogOpen}
        onOpenChange={thermalProfiles.setBulkDeleteThermalProfileDialogOpen}
        title="Eliminar Perfiles Térmicos"
        description={
          thermalProfiles.thermalProfilesToDelete && thermalProfiles.thermalProfilesToDelete.length > 0 ? (
            <>
              ¿Estás seguro de que deseas eliminar {thermalProfiles.thermalProfilesToDelete.length} perfil(es) térmico(s)
              seleccionado(s)?
            </>
          ) : (
            '¿Estás seguro de que deseas eliminar los perfiles térmicos seleccionados?'
          )
        }
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={thermalProfiles.handleConfirmBulkDeleteThermalProfile}
      />

      {/* Confirmation Dialogs for Product Actions */}
      <ConfirmDialog
        open={products.deleteProductDialogOpen}
        onOpenChange={products.setDeleteProductDialogOpen}
        title="Eliminar Producto"
        description={
          products.productToAction ? (
            <>
              ¿Estás seguro de que deseas eliminar el producto{' '}
              <strong>{products.productToAction.name}</strong>?
            </>
          ) : (
            '¿Estás seguro de que deseas eliminar este producto?'
          )
        }
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={products.handleConfirmDeleteProduct}
      />

      <ConfirmDialog
        open={products.bulkDeleteProductDialogOpen}
        onOpenChange={products.setBulkDeleteProductDialogOpen}
        title="Eliminar Productos"
        description={
          products.productsToDelete && products.productsToDelete.length > 0 ? (
            <>
              ¿Estás seguro de que deseas eliminar {products.productsToDelete.length} producto(s)
              seleccionado(s)?
            </>
          ) : (
            '¿Estás seguro de que deseas eliminar los productos seleccionados?'
          )
        }
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={products.handleConfirmBulkDeleteProduct}
      />

      {/* Confirmation Dialogs for Rate Card Actions */}
      <ConfirmDialog
        open={rateCards.deleteRateCardDialogOpen}
        onOpenChange={rateCards.setDeleteRateCardDialogOpen}
        title="Desactivar tarifario"
        description={
          rateCards.rateCardToAction ? (
            <>
              ¿Desactivar el tarifario{' '}
              <strong>{rateCards.rateCardToAction.name || 'sin nombre'}</strong>? Podrás
              reactivarlo después.
            </>
          ) : (
            '¿Desactivar este tarifario? Podrás reactivarlo después.'
          )
        }
        confirmText="Sí, desactivar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={rateCards.handleConfirmDeleteRateCard}
      />

      <ConfirmDialog
        open={rateCards.bulkDeleteRateCardDialogOpen}
        onOpenChange={rateCards.setBulkDeleteRateCardDialogOpen}
        title="Desactivar tarifarios"
        description={
          rateCards.rateCardsToDelete && rateCards.rateCardsToDelete.length > 0 ? (
            <>
              ¿Desactivar {rateCards.rateCardsToDelete.length} tarifario(s) seleccionado(s)? Podrás
              reactivarlos después.
            </>
          ) : (
            '¿Desactivar los tarifarios seleccionados? Podrás reactivarlos después.'
          )
        }
        confirmText="Sí, desactivar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={rateCards.handleConfirmBulkDeleteRateCard}
      />

      <ConfirmDialog
        open={rateCards.bulkPermanentDeleteRateCardDialogOpen}
        onOpenChange={rateCards.setBulkPermanentDeleteRateCardDialogOpen}
        title="Eliminar permanentemente"
        description={
          rateCards.bulkPermanentDeleteChecking ? (
            'Comprobando tarifarios seleccionados...'
          ) : rateCards.bulkPermanentDeleteSummary ? (
            <>
              Se eliminarán permanentemente{' '}
              <strong>{rateCards.bulkPermanentDeleteSummary.canDelete} tarifario(s)</strong>
              {rateCards.bulkPermanentDeleteSummary.skipped > 0 &&
                ` (${rateCards.bulkPermanentDeleteSummary.skipped} omitido(s): asociados a órdenes de despacho)`}
              . Esta acción no se puede deshacer. ¿Continuar?
            </>
          ) : (
            '¿Eliminar permanentemente los tarifarios seleccionados?'
          )
        }
        confirmText="Sí, eliminar permanentemente"
        cancelText="Cancelar"
        variant="destructive"
        confirmDisabled={rateCards.bulkPermanentDeleteChecking || !rateCards.bulkPermanentDeleteSummary}
        confirmLoading={rateCards.isBulkPermanentDeleteConfirming}
        confirmLoadingText="Eliminando..."
        onConfirm={rateCards.handleConfirmBulkPermanentDeleteRateCard}
      />

      <ConfirmDialog
        open={rateCards.permanentDeleteRateCardDialogOpen}
        onOpenChange={rateCards.setPermanentDeleteRateCardDialogOpen}
        title="Eliminar permanentemente"
        description={
          rateCards.permanentDeleteCheckStatus === 'checking' ? (
            'Comprobando si se puede eliminar...'
          ) : rateCards.permanentDeleteCheckStatus === 'blocked' ? (
            'No se puede eliminar: el tarifario está asociado a órdenes de despacho.'
          ) : rateCards.rateCardToAction ? (
            <>
              El tarifario <strong>{rateCards.rateCardToAction.name || 'sin nombre'}</strong> se
              borrará para siempre (cargos, tramos y modificadores térmicos). Esta acción no se
              puede deshacer. ¿Continuar?
            </>
          ) : (
            '¿Eliminar este tarifario de forma permanente?'
          )
        }
        confirmText="Sí, eliminar permanentemente"
        cancelText="Cancelar"
        variant="destructive"
        confirmDisabled={rateCards.permanentDeleteCheckStatus !== 'allowed'}
        confirmLoading={rateCards.isPermanentDeleteConfirming}
        confirmLoadingText="Eliminando..."
        onConfirm={rateCards.handleConfirmPermanentDeleteRateCard}
      />
    </>
  )
}
