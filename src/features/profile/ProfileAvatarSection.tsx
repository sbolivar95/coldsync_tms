import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/Avatar'
import { Camera } from 'lucide-react'

interface ProfileAvatarSectionProps {
  displayName: string
  displayRole: string
  firstName?: string
  lastName?: string
}

export function ProfileAvatarSection({
  displayName,
  displayRole,
  firstName,
  lastName,
}: ProfileAvatarSectionProps) {
  return (
    <div className='flex items-center gap-4 mb-6'>
      <div className='relative'>
        <Avatar className='w-20 h-20'>
          <AvatarImage
            src=''
            alt={displayName}
          />
          <AvatarFallback className='bg-primary text-white text-xl'>
            {firstName?.[0] || ''}
            {lastName?.[0] || ''}
          </AvatarFallback>
        </Avatar>
        <button className='absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border border-gray-200 hover:bg-gray-50'>
          <Camera className='w-3.5 h-3.5 text-gray-600' />
        </button>
      </div>
      <div>
        <h3 className='font-semibold text-gray-900'>{displayName}</h3>
        <p className='text-sm text-gray-500'>{displayRole}</p>
      </div>
    </div>
  )
}