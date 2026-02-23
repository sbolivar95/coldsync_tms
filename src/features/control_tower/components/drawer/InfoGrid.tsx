interface InfoField {
  label: string;
  value: string | React.ReactNode;
}

interface InfoGridProps {
  fields: InfoField[];
}

export function InfoGrid({ fields }: InfoGridProps) {
  return (
    <div className="grid grid-cols-5 gap-5 pt-2 items-end">
      {fields.map((field, index) => (
        <div key={index}>
          <p className="text-gray-400 text-[11px] pb-1">{field.label}</p>
          <p className="text-gray-900 text-[13px] h-6 flex items-center">
            {field.value}
          </p>
        </div>
      ))}
    </div>
  );
}
