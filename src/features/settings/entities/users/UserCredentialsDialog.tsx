import { useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../../components/ui/Dialog";
import { Key } from "lucide-react";
import type { User } from "../../../../types/user.types";
import { UserCredentialsFields } from "./components/UserCredentialsFields";
import { toast } from "sonner";

interface UserCredentialsDialogProps {
  open: boolean;
  onClose: () => void;
  user?: User;
  credentials?: {
    email: string;
    password: string;
  };
}

export function UserCredentialsDialog({
  open,
  onClose,
  user,
  credentials
}: UserCredentialsDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Check if required data is available
  const hasRequiredData = user && credentials && credentials.email && credentials.password;

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field === 'email' ? 'Email' : 'Contraseña'} copiada al portapapeles`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error('Error al copiar al portapapeles');
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleCopyAll = async () => {
    if (!credentials) return;
    const credentialsText = `Email: ${credentials.email}\nContraseña: ${credentials.password}`;
    try {
      await navigator.clipboard.writeText(credentialsText);
      setCopiedField('all');
      toast.success('Todas las credenciales copiadas al portapapeles');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error('Error al copiar al portapapeles');
      console.error('Error copying to clipboard:', error);
    }
  };

  const fullName = user
    ? `${user.firstName || user.nombre || ""} ${user.lastName || user.apellido || ""}`.trim() || user.email
    : "";

  // Handle dialog open/close
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Only close if we have data (user closed it manually)
      if (hasRequiredData) {
        onClose()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        {hasRequiredData ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-600" />
                Credenciales de Acceso
              </DialogTitle>
              <DialogDescription className="mt-2">
                Credenciales generadas para {fullName}. Cópialas y envíalas al cliente de forma segura.
              </DialogDescription>
            </DialogHeader>

            <UserCredentialsFields
              credentials={credentials}
              onCopyAll={handleCopyAll}
              copiedField={copiedField}
              onCopy={handleCopy}
            />
          </>
        ) : (
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-600" />
              Cargando credenciales...
            </DialogTitle>
            <DialogDescription className="mt-2">
              Por favor espera mientras se generan las credenciales.
            </DialogDescription>
          </DialogHeader>
        )}
      </DialogContent>
    </Dialog>
  );
}