import { SetMtg } from '../services/api';

interface SetItemProps {
  set: SetMtg;
  isSelected: boolean;
  onClick: (set: SetMtg) => void;
}

const SetItem = ({ set, isSelected, onClick }: SetItemProps) => {
  return (
    <div
      onClick={() => onClick(set)}
      className={`p-4 rounded-lg cursor-pointer transition-all ${
        isSelected
          ? 'bg-blue-100 border-2 border-blue-500'
          : 'bg-white hover:bg-gray-50 border border-gray-200'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{set.name}</h3>
          <p className="text-sm text-gray-600">Código: {set.setCode}</p>
        </div>
        <span className="text-sm font-medium text-blue-600">
          {set.totalCards} cartas
        </span>
      </div>
      <div className="mt-2">
        <p className="text-sm text-gray-500">
          Fecha de lanzamiento: {new Date(set.releaseDate).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default SetItem; 