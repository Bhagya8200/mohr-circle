import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

const MohrCircleVisualization = () => {
  const [isAnimating, setIsAnimating] = useState(true);
  // Updated initial strains based on the given results
  const [strains, setStrains] = useState({
    normalX: 2.0,  // εx = 2.0 μm/m
    normalY: 0.2,  // εy = 0.2 μm/m
    shearXY: 1.81/2  // γxy/2 = 1.81/2 μm/m (using half of γmax since we work with γ/2)
  });
  const [currentStrains, setCurrentStrains] = useState({
    normal: 0,
    shear: 0
  });
  // Initialize angle to match the given principal strain angle (-2.38 degrees)
  const [angle, setAngle] = useState(-2.38 * Math.PI / 180);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  const containerRef = useRef(null);

  // Animation speed configuration
  const CIRCLE_DURATION = 30000; // 30 seconds for one complete circle
  const ANGLE_PER_MS = (2 * Math.PI) / CIRCLE_DURATION;

  const calculateMohrCircle = () => {
    const { normalX, normalY, shearXY } = strains;
    const center = (normalX + normalY) / 2;
    const radius = Math.sqrt(Math.pow((normalX - normalY) / 2, 2) + Math.pow(shearXY, 2));
    return { center, radius };
  };

  const calculateCurrentStrains = (angle) => {
    const { center, radius } = calculateMohrCircle();
    const normal = center + radius * Math.cos(angle);
    const shear = radius * Math.sin(angle);
    return { normal, shear };
  };

  const updateCanvasSize = () => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    
    const container = containerRef.current;
    canvas.width = container.offsetWidth * 0.9;  // 90% of container width
    canvas.height = container.offsetHeight * 0.6; // 60% of container height
    drawMohrCircle();
  };

  useEffect(() => {
    window.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const drawMohrCircle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const scale = Math.min(width, height) / 4;

    ctx.clearRect(0, 0, width, height);
    ctx.translate(width / 2, height / 2);

    // Draw axes with larger font
    ctx.beginPath();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.moveTo(-width / 2, 0);
    ctx.lineTo(width / 2, 0);
    ctx.moveTo(0, -height / 2);
    ctx.lineTo(0, height / 2);
    ctx.stroke();

    ctx.font = '16px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText('Normal Strain (ε)', width / 2 - 120, 25);
    ctx.save();
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Shear Strain (γ/2)', height / 2 - 120, -10);
    ctx.restore();

    // Draw Mohr's circle
    const { center, radius } = calculateMohrCircle();
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.arc(center * scale, 0, radius * scale, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw animated point and radius line
    const pointX = center * scale + radius * scale * Math.cos(angle);
    const pointY = radius * scale * Math.sin(angle);
    
    // Radius line
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444';
    ctx.setLineDash([4, 4]);
    ctx.moveTo(center * scale, 0);
    ctx.lineTo(pointX, pointY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Point
    ctx.beginPath();
    ctx.fillStyle = '#ef4444';
    ctx.arc(pointX, pointY, 6, 0, 2 * Math.PI);
    ctx.fill();

    const currentValues = calculateCurrentStrains(angle);
    setCurrentStrains(currentValues);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  const animate = (timestamp) => {
    if (!isAnimating) return;
    
    if (!lastUpdateTimeRef.current) {
      lastUpdateTimeRef.current = timestamp;
    }

    const deltaTime = timestamp - lastUpdateTimeRef.current;
    const angleChange = ANGLE_PER_MS * deltaTime;
    
    setAngle((prev) => (prev + angleChange) % (2 * Math.PI));
    lastUpdateTimeRef.current = timestamp;
    
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    drawMohrCircle();
  }, [angle, strains]);

  useEffect(() => {
    if (isAnimating) {
      lastUpdateTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationRef.current);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [isAnimating]);

  const handleInputChange = (e, field) => {
    const value = parseFloat(e.target.value);
    setStrains(prev => ({
      ...prev,
      [field]: isNaN(value) ? 0 : value
    }));
  };

  return (
    <div className="h-screen w-screen bg-gray-50">
      <div ref={containerRef} className="h-full w-full p-4 flex flex-col">
        <div className="bg-white rounded-lg shadow-lg p-4 flex-grow flex flex-col">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Mohr's Circle - Strain Analysis</h2>
          
          {/* Input Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Normal Strain X (εx) [μm/m]</label>
              <input
                type="number"
                step="0.1"
                value={strains.normalX}
                onChange={(e) => handleInputChange(e, 'normalX')}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Normal Strain Y (εy) [μm/m]</label>
              <input
                type="number"
                step="0.1"
                value={strains.normalY}
                onChange={(e) => handleInputChange(e, 'normalY')}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Shear Strain γxy/2 [μm/m]</label>
              <input
                type="number"
                step="0.1"
                value={strains.shearXY}
                onChange={(e) => handleInputChange(e, 'shearXY')}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <button
                onClick={() => setIsAnimating(!isAnimating)}
                className="mb-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2 w-fit"
              >
                {isAnimating ? <Pause size={20} /> : <Play size={20} />}
                {isAnimating ? 'Pause' : 'Continue'}
              </button>

              <div className="flex-grow relative border rounded-lg overflow-hidden bg-gray-50">
                <canvas
                  ref={canvasRef}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Current Strain State</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value [μm/m]</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Angle [°]</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Normal Strain (ε)</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {currentStrains.normal.toFixed(3)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {((angle * 180) / Math.PI).toFixed(2)}°
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Shear Strain (γ/2)</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {currentStrains.shear.toFixed(3)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {((angle * 180) / Math.PI + 90).toFixed(2)}°
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Legend</h4>
                <p>• Blue Circle: Mohr's Circle</p>
                <p>• Red Point: Current State of Strain</p>
                <p>• Red Dashed Line: Radius Vector</p>
                <p>• Animation Period: 30 seconds per revolution</p>
                <p>• Angle is measured counterclockwise from horizontal</p>
                <p>• All strain values are in μm/m (microstrain)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MohrCircleVisualization;