import { UseFormReturn } from 'react-hook-form'
import { Input } from '../../components/ui/Input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/Form'
import { type ProfileFormData } from '../../lib/schemas/profile.schemas'

interface ProfilePersonalInfoFormProps {
  form: UseFormReturn<ProfileFormData>
  onSubmit: (data: ProfileFormData) => Promise<void>
}

export function ProfilePersonalInfoForm({
  form,
  onSubmit,
}: ProfilePersonalInfoFormProps) {
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-4'
      >
        <h4 className='text-sm font-semibold text-gray-900'>
          Mis Datos
        </h4>
        <div className='grid grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='firstName'
            render={({ field }) => (
              <FormItem className='space-y-1.5'>
                <FormLabel className='text-xs text-gray-600'>
                  Nombre
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage className='text-xs' />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='lastName'
            render={({ field }) => (
              <FormItem className='space-y-1.5'>
                <FormLabel className='text-xs text-gray-600'>
                  Apellido
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage className='text-xs' />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem className='space-y-1.5'>
                <FormLabel className='text-xs text-gray-600'>
                  Correo
                </FormLabel>
                <FormControl>
                  <Input
                    type='email'
                    {...field}
                  />
                </FormControl>
                <FormMessage className='text-xs' />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='phone'
            render={({ field }) => (
              <FormItem className='space-y-1.5'>
                <FormLabel className='text-xs text-gray-600'>
                  Teléfono
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage className='text-xs' />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  )
}