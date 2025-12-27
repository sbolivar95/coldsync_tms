import { PageHeader } from "../layouts/PageHeader";
import { useState } from "react";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/Avatar";
import { PrimaryButton } from "../components/widgets/PrimaryButton";
import { SecondaryButton } from "../components/widgets/SecondaryButton";
import { Card } from "../components/ui/Card";
import { Camera, LogOut } from "lucide-react";

export function Profile() {
  // Estado para el perfil
  const [perfilData, setPerfilData] = useState({
    nombre: "Carlos",
    apellido: "Rodríguez",
    correo: "carlos.rodriguez@coldsync.com",
    telefono: "+56 9 8765 4321",
    rol: "Administrador",
  });

  // Estado para datos de la empresa
  const [empresaData, setEmpresaData] = useState({
    nombreEmpresa: "Transportes ColdSync Chile",
    rut: "76.123.456-7",
    direccion: "Av. Providencia 1234, Santiago",
    telefono: "+56 2 2345 6789",
  });

  // Estado para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    actual: "",
    nueva: "",
    confirmar: "",
  });

  const handleSaveProfile = () => {
    console.log("Guardar perfil:", perfilData, empresaData);
  };

  const handleChangePassword = () => {
    console.log("Cambiar contraseña:", passwordData);
    // Limpiar campos después de guardar
    setPasswordData({ actual: "", nueva: "", confirmar: "" });
  };

  const handleLogout = () => {
    console.log("Cerrar sesión");
    // Aquí iría la lógica de logout (limpiar tokens, redirigir, etc.)
    // Por ahora solo muestra un mensaje en consola
    alert("Sesión cerrada exitosamente");
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader />
      
      <div className="flex-1 p-6 bg-gray-50 overflow-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Información Personal */}
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src="" alt={`${perfilData.nombre} ${perfilData.apellido}`} />
                  <AvatarFallback className="bg-[#004ef0] text-white text-xl">
                    {perfilData.nombre[0]}{perfilData.apellido[0]}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border border-gray-200 hover:bg-gray-50">
                  <Camera className="w-3.5 h-3.5 text-gray-600" />
                </button>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {perfilData.nombre} {perfilData.apellido}
                </h3>
                <p className="text-sm text-gray-500">{perfilData.rol}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900">Mis Datos</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={perfilData.nombre}
                    onChange={(e) => setPerfilData({ ...perfilData, nombre: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    value={perfilData.apellido}
                    onChange={(e) => setPerfilData({ ...perfilData, apellido: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="correo">Correo</Label>
                  <Input
                    id="correo"
                    type="email"
                    value={perfilData.correo}
                    onChange={(e) => setPerfilData({ ...perfilData, correo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={perfilData.telefono}
                    onChange={(e) => setPerfilData({ ...perfilData, telefono: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Datos de la Empresa */}
          <Card className="p-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Datos de la Empresa</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombreEmpresa">Nombre</Label>
                <Input
                  id="nombreEmpresa"
                  value={empresaData.nombreEmpresa}
                  onChange={(e) => setEmpresaData({ ...empresaData, nombreEmpresa: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rut">RUT</Label>
                <Input
                  id="rut"
                  value={empresaData.rut}
                  onChange={(e) => setEmpresaData({ ...empresaData, rut: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={empresaData.direccion}
                  onChange={(e) => setEmpresaData({ ...empresaData, direccion: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefonoEmpresa">Teléfono</Label>
                <Input
                  id="telefonoEmpresa"
                  value={empresaData.telefono}
                  onChange={(e) => setEmpresaData({ ...empresaData, telefono: e.target.value })}
                />
              </div>
            </div>
          </Card>

          {/* Cambiar Contraseña */}
          <Card className="p-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Cambiar Contraseña</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="actual">Contraseña Actual</Label>
                <Input
                  id="actual"
                  type="password"
                  value={passwordData.actual}
                  onChange={(e) => setPasswordData({ ...passwordData, actual: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nueva">Nueva Contraseña</Label>
                  <Input
                    id="nueva"
                    type="password"
                    value={passwordData.nueva}
                    onChange={(e) => setPasswordData({ ...passwordData, nueva: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmar">Confirmar Contraseña</Label>
                  <Input
                    id="confirmar"
                    type="password"
                    value={passwordData.confirmar}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmar: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="pt-2">
                <SecondaryButton 
                  onClick={handleChangePassword}
                  disabled={!passwordData.actual || !passwordData.nueva || !passwordData.confirmar}
                >
                  Actualizar Contraseña
                </SecondaryButton>
              </div>
            </div>
          </Card>

          {/* Cerrar Sesión */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Sesión</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Cierra tu sesión de forma segura
                </p>
              </div>
              <SecondaryButton onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </SecondaryButton>
            </div>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3">
            <SecondaryButton>
              Cancelar
            </SecondaryButton>
            <PrimaryButton onClick={handleSaveProfile}>
              Guardar Cambios
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}