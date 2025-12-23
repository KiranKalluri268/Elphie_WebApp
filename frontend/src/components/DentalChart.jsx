import { useState, useMemo } from 'react';
import DentalChartSvg from './DentalChartSvg';

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

  // Calculate colors for each tooth
  const toothColors = useMemo(() => {
    const colors = {};

    // Mark treated teeth as Yellow
    Object.keys(toothRecords).forEach((toothId) => {
      colors[toothId] = '#ffeb3b';
    });

    // Mark selected tooth as Blue (overrides treated status)
    if (selectedTooth) {
      colors[selectedTooth] = '#667eea';
    }

    return colors;
  }, [toothRecords, selectedTooth]);

  const handleToothClick = (toothId) => {
    const newSelected = toothId === selectedTooth ? null : toothId;
    setSelectedTooth(newSelected);
    if (onToothClick) onToothClick(newSelected);
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
        <div className="bg-white rounded-lg shadow-sm w-full max-w-[900px]">
          <DentalChartSvg
            toothColors={toothColors}
            onToothClick={handleToothClick}
          />
        </div>
      </div>

      <p className="text-gray-400 text-[13px] mt-2.5 italic">Select a tooth to view detailed records and history</p>
    </div>
  );
}

export default DentalChart;
