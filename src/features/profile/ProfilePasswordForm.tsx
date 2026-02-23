import { UseFormReturn } from 'react-hook-form'
import { useState, useMemo } from 'react'
import { Input } from '../../components/ui/Input'
import { SecondaryButton } from '../../components/widgets/SecondaryButton'
import { Check, Key } from 'lucide-react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/Form'
import { type PasswordFormData } from '../../lib/schemas/profile.schemas'

interface ProfilePasswordFormProps {
  form: UseFormReturn<PasswordFormData>
  onSubmit: (data: PasswordFormData) => Promise<void>
  isLoading?: boolean
}

export function ProfilePasswordForm({
  form,
  onSubmit,
  isLoading = false,
}: ProfilePasswordFormProps) {
  const [justSaved, setJustSaved] = useState(false)

  // Watch form values to detect if all fields are filled
  const watchedValues = form.watch()
  
  // Check if form has all required fields filled
  const hasAllFields = useMemo(() => {
    return !!(
      watchedValues.new?.trim() &&
      watchedValues.confirm?.trim()
    )
  }, [watchedValues])

  // Enhanced submit handler with feedback
  const handleSubmit = async (data: PasswordFormData) => {
    setJustSaved(false)
    
    try {
      await onSubmit(data)
      setJustSaved(true)
      
      // Clear the "just saved" indicator after 3 seconds
      setTimeout(() => setJustSaved(false), 3000)
    } catch (error) {
      // Error handling is done in the parent component
      throw error
    }
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <h4 className='text-sm font-semibold text-gray-900 mb-4'>
          Cambiar Contraseña
        </h4>
        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='new'
              render={({ field }) => (
                <FormItem className='space-y-1.5'>
                  <FormLabel className='text-xs text-gray-600'>
                    Nueva Contraseña
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      placeholder='••••••••'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='text-xs' />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='confirm'
              render={({ field }) => (
                <FormItem className='space-y-1.5'>
                  <FormLabel className='text-xs text-gray-600'>
                    Confirmar Contraseña
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      placeholder='••••••••'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='text-xs' />
                </FormItem>
              )}
            />
          </div>
          <div className='pt-2'>
            <SecondaryButton
              type='submit'
              icon={justSaved ? Check : Key}
              disabled={isLoading || !hasAllFields}
              className={justSaved ? 'bg-green-100 text-green-700 border-green-300' : ''}
            >
              {isLoading ? 'Actualizando...' : justSaved ? 'Contraseña Actualizada' : 'Actualizar Contraseña'}
            </SecondaryButton>
          </div>
        </div>
      </form>
    </Form>
  )
}