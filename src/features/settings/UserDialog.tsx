import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../components/ui/Dialog";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { SmartSelect } from "../../components/widgets/SmartSelect";
import { DialogActions } from "../../components/widgets/DialogActions";
import { useState, useEffect } from "react";
import { type User, roleOptions, userStatusOptions } from "../../lib/mockData";

interface UserDialogProps {
  open: boolean;
  onClose: () => void;
  user?: User;
  onSave: (user: User) => void;
}

export function UserDialog({ open, onClose, user, onSave }: UserDialogProps) {
  const [formData, setFormData] = useState<User>({
    firstName: "",
    lastName: "",
    email: "",
    role: "Operador",
    status: "Activo",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      // Support both English and Spanish field names for backward compatibility
      setFormData({
        id: user.id,
        firstName: user.firstName || user.nombre || "",
        lastName: user.lastName || user.apellido || "",
        email: user.email || user.correo || "",
        role: user.role || user.rol || "Operador",
        status: user.status || user.estado || "Activo",
        phone: user.phone || user.telefono || "",
        lastAccess: user.lastAccess || user.ultimoAcceso,
        createdAt: user.createdAt || user.creado,
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        role: "Operador",
        status: "Activo",
        phone: "",
      });
    }
  }, [user, open]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {user ? "Editar Usuario" : "Nuevo Usuario"}
          </DialogTitle>
          <DialogDescription>
            {user 
              ? "Actualiza la información del usuario en el sistema."
              : "Completa los datos para crear un nuevo usuario en ColdSync."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* First Name and Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Juan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Pérez"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="juan.perez@coldsync.com"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+56 9 1234 5678"
            />
          </div>

          {/* Role and Status */}
          <div className="grid grid-cols-2 gap-4">
            <SmartSelect
              label="Rol"
              id="role"
              required
              value={formData.role}
              onChange={(value) => setFormData({ ...formData, role: value as string })}
              options={roleOptions}
              placeholder="Seleccionar rol..."
              searchable={false}
            />
            <div className="space-y-2">
              <Label htmlFor="status">Estado *</Label>
              <SmartSelect
                options={userStatusOptions}
                value={formData.status}
                onChange={(value) => setFormData({ ...formData, status: value as string })}
                placeholder="Seleccionar estado"
                searchable={false}
              />
            </div>
          </div>

          {!user && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-xs text-blue-900">
                <strong>Nota:</strong> Se enviará un correo de bienvenida al usuario con instrucciones para establecer su contraseña.
              </p>
            </div>
          )}
        </div>

        <DialogActions
          onCancel={onClose}
          onSave={handleSave}
          disableSave={!formData.firstName || !formData.lastName || !formData.email || !formData.role}
        />
      </DialogContent>
    </Dialog>
  );
}