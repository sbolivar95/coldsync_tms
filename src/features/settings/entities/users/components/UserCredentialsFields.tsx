import { useState } from "react";
import { Input } from "../../../../../components/ui/Input";
import { Button } from "../../../../../components/ui/Button";
import { Copy, Eye, EyeOff } from "lucide-react";

interface UserCredentialsFieldsProps {
  credentials: {
    email: string;
    password: string;
  };
  onCopyAll: () => void;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}

export function UserCredentialsFields({
  credentials,
  onCopyAll,
  copiedField,
  onCopy
}: UserCredentialsFieldsProps) {
  const [showPassword, setShowPassword] = useState(false);

  const emailFieldId = 'user-credentials-email'
  const passwordFieldId = 'user-credentials-password'

  return (
    <div className="space-y-6 py-4">
      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor={emailFieldId} className="text-sm font-medium text-gray-700">
          Email
        </label>
        <div className="relative">
          <Input
            id={emailFieldId}
            value={credentials.email}
            readOnly
            className="pr-10 bg-gray-50 border-gray-200"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(credentials.email, 'email')}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
          >
            <Copy className={`h-4 w-4 ${copiedField === 'email' ? 'text-green-600' : 'text-gray-500'}`} />
          </Button>
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label htmlFor={passwordFieldId} className="text-sm font-medium text-gray-700">
          Contraseña
        </label>
        <div className="relative">
          <Input
            id={passwordFieldId}
            type={showPassword ? "text" : "password"}
            value={credentials.password}
            readOnly
            className="pr-20 bg-gray-50 border-gray-200"
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPassword(!showPassword)}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-500" />
              ) : (
                <Eye className="h-4 w-4 text-gray-500" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopy(credentials.password, 'password')}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <Copy className={`h-4 w-4 ${copiedField === 'password' ? 'text-green-600' : 'text-gray-500'}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Warning Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Importante:</span> Guarda estas credenciales de forma segura. Envíalas al cliente por un canal seguro.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="pt-4">
        <Button
          variant="outline"
          onClick={onCopyAll}
          className="w-full flex items-center justify-center gap-2"
        >
          <Copy className={`w-4 h-4 ${copiedField === 'all' ? 'text-green-600' : ''}`} />
          {copiedField === 'all' ? 'Copiado!' : 'Copiar Todo'}
        </Button>
      </div>
    </div>
  );
}