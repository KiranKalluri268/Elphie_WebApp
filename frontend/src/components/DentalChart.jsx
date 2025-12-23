import { useState, useMemo } from 'react';

// FDI tooth numbering system
const UPPER_TEETH = [
  { id: '18', label: '18', x: 50, y: 40 }, { id: '17', label: '17', x: 100, y: 40 },
  { id: '16', label: '16', x: 150, y: 40 }, { id: '15', label: '15', x: 200, y: 40 },
  { id: '14', label: '14', x: 250, y: 40 }, { id: '13', label: '13', x: 300, y: 40 },
  { id: '12', label: '12', x: 350, y: 40 }, { id: '11', label: '11', x: 400, y: 40 },
  { id: '21', label: '21', x: 450, y: 40 }, { id: '22', label: '22', x: 500, y: 40 },
  { id: '23', label: '23', x: 550, y: 40 }, { id: '24', label: '24', x: 600, y: 40 },
  { id: '25', label: '25', x: 650, y: 40 }, { id: '26', label: '26', x: 700, y: 40 },
  { id: '27', label: '27', x: 750, y: 40 }, { id: '28', label: '28', x: 800, y: 40 },
];

const LOWER_TEETH = [
  { id: '38', label: '38', x: 50, y: 180 }, { id: '37', label: '37', x: 100, y: 180 },
  { id: '36', label: '36', x: 150, y: 180 }, { id: '35', label: '35', x: 200, y: 180 },
  { id: '34', label: '34', x: 250, y: 180 }, { id: '33', label: '33', x: 300, y: 180 },
  { id: '32', label: '32', x: 350, y: 180 }, { id: '31', label: '31', x: 400, y: 180 },
  { id: '41', label: '41', x: 450, y: 180 }, { id: '42', label: '42', x: 500, y: 180 },
  { id: '43', label: '43', x: 550, y: 180 }, { id: '44', label: '44', x: 600, y: 180 },
  { id: '45', label: '45', x: 650, y: 180 }, { id: '46', label: '46', x: 700, y: 180 },
  { id: '47', label: '47', x: 750, y: 180 }, { id: '48', label: '48', x: 800, y: 180 },
];

// Complex paths to look more like real teeth
const TOOTH_DETAILS = {
  molar: {
    path: "M5,8 C5,4 10,2 17.5,2 C25,2 30,4 30,8 C32,15 32,25 30,32 C25,36 10,36 5,32 C3,25 3,15 5,8 Z",
    lines: "M10,12 Q17.5,15 25,12 M17.5,2 L17.5,36"
  },
  premolar: {
    path: "M8,8 C8,4 12,2 17.5,2 C23,2 27,4 27,8 C29,15 29,25 27,32 C23,36 12,36 8,32 C6,25 6,15 8,8 Z",
    lines: "M12,15 Q17.5,18 23,15 M17.5,2 L17.5,36"
  },
  canine: {
    path: "M10,10 C10,5 17.5,0 25,10 C28,18 28,28 25,34 C20,38 15,38 10,34 C7,28 7,18 10,10 Z",
    lines: "M17.5,0 L17.5,38"
  },
  incisor: {
    path: "M10,2 L25,2 C28,10 28,30 25,35 C20,38 15,38 10,35 C7,30 7,10 10,2 Z",
    lines: "M17.5,2 L17.5,38"
  }
};

const getToothType = (id) => {
  const lastDigit = parseInt(id.charAt(1));
  if (lastDigit >= 6) return 'molar';
  if (lastDigit >= 4) return 'premolar';
  if (lastDigit === 3) return 'canine';
  return 'incisor';
};

function DentalChart({ onToothClick, patient }) {
  const [selectedTooth, setSelectedTooth] = useState(null);

  const toothRecords = useMemo(() => {
    if (!patient || !patient.visits) return {};
    const records = {};
    patient.visits.forEach((visit) => {
      if (visit.dentalRecords) {
        visit.dentalRecords.forEach((record) => {
          if (!records[record.toothNumber]) records[record.toothNumber] = [];
          records[record.toothNumber].push(record);
        });
      }
    });
    return records;
  }, [patient]);

  const handleToothClick = (toothId) => {
    setSelectedTooth(toothId === selectedTooth ? null : toothId);
    if (onToothClick) onToothClick(toothId);
  };

  const renderTooth = (tooth) => {
    const hasRecords = toothRecords[tooth.id] && toothRecords[tooth.id].length > 0;
    const isSelected = selectedTooth === tooth.id;
    const type = getToothType(tooth.id);
    const details = TOOTH_DETAILS[type];
    const isUpper = parseInt(tooth.id.charAt(0)) <= 2;

    return (
      <g
        key={tooth.id}
        transform={`translate(${tooth.x}, ${tooth.y})`}
        onClick={() => handleToothClick(tooth.id)}
        style={{ cursor: 'pointer' }}
        className={`transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:scale-105 ${isSelected ? 'selected' : ''} ${hasRecords ? 'has-records' : ''} group`}
      >
        <path
          d={details.path}
          className={`transition-colors duration-200 drop-shadow-sm group-hover:fill-gray-100 group-hover:stroke-gray-400 ${isSelected ? 'filter drop-shadow-md' : ''}`}
          fill={isSelected ? '#667eea' : hasRecords ? '#ffeb3b' : '#ffffff'}
          stroke={isSelected ? '#4a5568' : '#cbd5e0'}
          strokeWidth="1.5"
          transform={isUpper ? "" : "scale(1, -1) translate(0, -38)"}
        />
        <path
          d={details.lines}
          fill="none"
          stroke={isSelected ? 'rgba(255,255,255,0.4)' : '#e2e8f0'}
          strokeWidth="0.8"
          strokeDasharray="2,2"
          transform={isUpper ? "" : "scale(1, -1) translate(0, -38)"}
          pointerEvents="none"
        />
        <text
          x="17.5"
          y={isUpper ? "55" : "-15"}
          textAnchor="middle"
          fontSize="10"
          fontWeight="700"
          fill={isSelected ? '#4a5568' : '#718096'}
          className="pointer-events-none"
          pointerEvents="none"
        >
          {tooth.label}
        </text>
      </g>
    );
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex gap-6 justify-center flex-wrap bg-white py-3 px-6 rounded-[50px] shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded border-[1.5px] border-gray-300 bg-white"></div>
          <span>Healthy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded border-[1.5px] border-yellow-400 bg-yellow-300"></div>
          <span>Treated</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded border-[1.5px] border-indigo-600 bg-[#667eea]"></div>
          <span>Active</span>
        </div>
      </div>
      <div className="overflow-x-auto w-full flex justify-center p-5 bg-gray-50 rounded-lg">
        <svg width="900" height="300" viewBox="0 0 900 300" className="bg-white rounded-lg shadow-sm">
          <defs>
            <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
              <feOffset dx="0" dy="1" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.2" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <text x="425" y="25" textAnchor="middle" fontSize="13" fontWeight="700" fill="#2d3748" letterSpacing="1">
            UPPER ARCH
          </text>
          {UPPER_TEETH.map(renderTooth)}

          <line x1="50" y1="135" x2="850" y2="135" stroke="#edf2f7" strokeWidth="2" strokeDasharray="10,5" />

          <text x="425" y="265" textAnchor="middle" fontSize="13" fontWeight="700" fill="#2d3748" letterSpacing="1">
            LOWER ARCH
          </text>
          {LOWER_TEETH.map(renderTooth)}
        </svg>
      </div>
      <p className="text-gray-400 text-[13px] mt-2.5 italic">Select a tooth to view detailed records and history</p>
    </div>
  );
}

export default DentalChart;
