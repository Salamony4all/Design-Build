/**
 * Design & Build - Professional CAD Canvas (LibreCAD 3 Engine)
 * High-performance 2D vector rendering with snapping and real-time drafting
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useProjectStore, useUIStore } from '../../store';

export default function CADCanvas({ activeTool, activeLayer, onCommandComplete }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Store State
    const cadEntities = useProjectStore(s => s.cadEntities);
    const cadLayers = useProjectStore(s => s.cadLayers);
    const addCadEntity = useProjectStore(s => s.addCadEntity);

    // View State
    const [view, setView] = useState({ scale: 10, offsetX: 0, offsetY: 0 });
    const [mousePos, setMousePos] = useState({ x: 0, y: 0, cadX: 0, cadY: 0 });
    const [snappedPos, setSnappedPos] = useState({ x: 0, y: 0, cadX: 0, cadY: 0 });

    // Drafting State
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState(null);
    const [tempPoints, setTempPoints] = useState([]);

    // ============================================================================
    // Coordinate Conversion
    // ============================================================================

    const screenToCad = useCallback((sx, sy, currentView = view) => {
        const cx = (sx - currentView.offsetX) / currentView.scale;
        const cy = (sy - currentView.offsetY) / currentView.scale;
        return { x: cx, y: cy };
    }, [view]);

    const cadToScreen = useCallback((cx, cy, currentView = view) => {
        const sx = cx * currentView.scale + currentView.offsetX;
        const sy = cy * currentView.scale + currentView.offsetY;
        return { x: sx, y: sy };
    }, [view]);

    // ============================================================================
    // Snapping Logic
    // ============================================================================

    const getSnappedPoint = (cadX, cadY) => {
        // Grid snapping (1.0 units)
        const snap = 1.0;
        const sx = Math.round(cadX / snap) * snap;
        const sy = Math.round(cadY / snap) * snap;

        // Point snapping (to existing vertices)
        let finalX = sx;
        let finalY = sy;
        let minDist = 0.5 / view.scale;

        cadEntities.forEach(entity => {
            if (entity.points) {
                entity.points.forEach(p => {
                    const d = Math.sqrt((p.x - cadX) ** 2 + (p.y - cadY) ** 2);
                    if (d < minDist) {
                        minDist = d;
                        finalX = p.x;
                        finalY = p.y;
                    }
                });
            }
        });

        return { x: finalX, y: finalY };
    };

    // ============================================================================
    // Rendering Engine
    // ============================================================================

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;

        // Clear
        ctx.fillStyle = '#0F1115'; // Dark CAD Background
        ctx.fillRect(0, 0, width, height);

        // Dynamically calculate grid spacing
        const minSpacing = 20; // pixels
        let gridStep = 1;
        while (gridStep * view.scale < minSpacing) {
            gridStep *= 10;
        }

        // Calculate visible grid range
        const viewMin = screenToCad(0, 0);
        const viewMax = screenToCad(width, height);

        // Grid lines
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 0.5;

        // Limit iterations to prevent crash on huge coordinates
        const startX = Math.floor(viewMin.x / gridStep) * gridStep;
        const endX = Math.ceil(viewMax.x / gridStep) * gridStep;
        const startY = Math.floor(viewMin.y / gridStep) * gridStep;
        const endY = Math.ceil(viewMax.y / gridStep) * gridStep;

        const maxLines = 500;
        let lineCount = 0;

        for (let x = startX; x <= endX; x += gridStep) {
            if (++lineCount > maxLines) break;
            const sx = cadToScreen(x, 0).x;
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, height);
        }
        lineCount = 0;
        for (let y = startY; y <= endY; y += gridStep) {
            if (++lineCount > maxLines) break;
            const sy = cadToScreen(0, y).y;
            ctx.moveTo(0, sy);
            ctx.lineTo(width, sy);
        }
        ctx.stroke();

        // Draw Axes
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.lineWidth = 1;
        const origin = cadToScreen(0, 0);
        ctx.beginPath();
        ctx.moveTo(origin.x, 0); ctx.lineTo(origin.x, height);
        ctx.moveTo(0, origin.y); ctx.lineTo(width, origin.y);
        ctx.stroke();

        // Draw Entities
        cadEntities.forEach(entity => {
            const layer = cadLayers.find(l => l.name === entity.layer);
            if (layer && !layer.visible) return;

            ctx.strokeStyle = entity.color || (layer ? layer.color : '#FFFFFF');
            ctx.lineWidth = 1.5;

            if (entity.type === 'LINE' || entity.type === 'POLYLINE') {
                ctx.beginPath();
                entity.points.forEach((p, i) => {
                    const s = cadToScreen(p.x, p.y);
                    if (i === 0) ctx.moveTo(s.x, s.y);
                    else ctx.lineTo(s.x, s.y);
                });
                ctx.stroke();
            } else if (entity.type === 'CIRCLE') {
                const s = cadToScreen(entity.x, entity.y);
                const r = entity.radius * view.scale;
                ctx.beginPath();
                ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
                ctx.stroke();
            } else if (entity.type === 'RECT') {
                const p1 = cadToScreen(entity.points[0].x, entity.points[0].y);
                const p2 = cadToScreen(entity.points[1].x, entity.points[1].y);
                ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
            }
        });

        // Draw Temporary Drafting Entity
        if (isDrawing && startPoint) {
            ctx.strokeStyle = '#3B82F6'; // Active Blue
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            const sStart = cadToScreen(startPoint.x, startPoint.y);
            const sEnd = cadToScreen(snappedPos.cadX, snappedPos.cadY);

            if (activeTool === 'line') {
                ctx.moveTo(sStart.x, sStart.y);
                ctx.lineTo(sEnd.x, sEnd.y);
            } else if (activeTool === 'rect') {
                ctx.strokeRect(sStart.x, sStart.y, sEnd.x - sStart.x, sEnd.y - sStart.y);
            } else if (activeTool === 'circle') {
                const r = Math.sqrt((snappedPos.cadX - startPoint.x) ** 2 + (snappedPos.cadY - startPoint.y) ** 2);
                ctx.arc(sStart.x, sStart.y, r * view.scale, 0, Math.PI * 2);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw Crosshair
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 0.5;
        const crossSize = 10;
        ctx.beginPath();
        ctx.moveTo(mousePos.x - crossSize, mousePos.y); ctx.lineTo(mousePos.x + crossSize, mousePos.y);
        ctx.moveTo(mousePos.x, mousePos.y - crossSize); ctx.lineTo(mousePos.x, mousePos.y + crossSize);
        ctx.stroke();

        // Draw Snapping Cursor
        const snapS = cadToScreen(snappedPos.cadX, snappedPos.cadY);
        ctx.strokeStyle = '#FBBF24'; // Snap Yellow
        ctx.strokeRect(snapS.x - 4, snapS.y - 4, 8, 8);

    }, [cadEntities, cadLayers, view, mousePos, snappedPos, isDrawing, startPoint, activeTool]);

    // ============================================================================
    // Event Handlers
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            const rect = containerRef.current.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        };

        window.addEventListener('resize', resize);
        resize();
        return () => window.removeEventListener('resize', resize);
    }, []);

    useEffect(() => {
        const animation = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animation);
    }, [render]);

    // Handle Wheel with passive: false to allow preventDefault
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const onWheel = (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;

            setView(v => {
                const mouseCadBefore = {
                    x: (mx - v.offsetX) / v.scale,
                    y: (my - v.offsetY) / v.scale
                };

                const newScale = Math.min(Math.max(v.scale * zoomDelta, 0.01), 5000);

                const sxAfter = mouseCadBefore.x * newScale + v.offsetX;
                const syAfter = mouseCadBefore.y * newScale + v.offsetY;

                return {
                    ...v,
                    scale: newScale,
                    offsetX: v.offsetX + (mx - sxAfter),
                    offsetY: v.offsetY + (my - syAfter)
                };
            });
        };

        canvas.addEventListener('wheel', onWheel, { passive: false });
        return () => canvas.removeEventListener('wheel', onWheel);
    }, []);

    // Auto-center on entities when they load
    const zoomExtents = useCallback(() => {
        if (cadEntities.length > 0) {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

            // Heuristic: First try to find bounds of significant entities (Rooms/Polylines)
            const mainEntities = cadEntities.filter(e => e.type === 'POLYLINE' || e.type === 'RECT');
            const targetEntities = mainEntities.length > 0 ? mainEntities : cadEntities;

            targetEntities.forEach(e => {
                const pts = e.points || (e.type === 'CIRCLE' ? [{ x: e.x - e.radius, y: e.y - e.radius }, { x: e.x + e.radius, y: e.y + e.radius }] : []);
                pts.forEach(p => {
                    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
                    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
                });
            });

            if (minX !== Infinity) {
                const width = Math.abs(maxX - minX);
                const height = Math.abs(maxY - minY);
                const centerX = minX + width / 2;
                const centerY = minY + height / 2;

                const canvas = canvasRef.current;
                if (canvas) {
                    const padding = 100;
                    const availableW = canvas.width - padding * 2;
                    const availableH = canvas.height - padding * 2;

                    // Prevent division by zero
                    const viewScale = Math.min(
                        availableW / Math.max(width, 0.1),
                        availableH / Math.max(height, 0.1)
                    );

                    setView({
                        scale: Math.min(Math.max(viewScale, 0.0001), 10000),
                        offsetX: canvas.width / 2 - centerX * viewScale,
                        offsetY: canvas.height / 2 - centerY * viewScale
                    });
                }
            }
        }
    }, [cadEntities]);

    useEffect(() => {
        zoomExtents();
    }, [cadEntities.length]);

    const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const cad = screenToCad(x, y);
        const snapped = getSnappedPoint(cad.x, cad.y);

        setMousePos({ x, y, cadX: cad.x, cadY: cad.y });
        setSnappedPos({ x: cadToScreen(snapped.x, 0).x, y: cadToScreen(0, snapped.y).y, cadX: snapped.x, cadY: snapped.y });

        // Handle Panning (Middle Mouse)
        if (e.buttons === 4) {
            setView(v => ({
                ...v,
                offsetX: v.offsetX + e.movementX,
                offsetY: v.offsetY + e.movementY
            }));
        }
    };

    const handleMouseDown = (e) => {
        if (e.button !== 0) return; // Only left click

        const cad = snappedPos;

        if (activeTool === 'select') {
            // Find entity near click
            return;
        }

        if (!isDrawing) {
            setStartPoint({ x: cad.cadX, y: cad.cadY });
            setIsDrawing(true);
        } else {
            // Finish Drawing
            const endPoint = { x: cad.cadX, y: cad.cadY };
            let newEntity = null;

            if (activeTool === 'line') {
                newEntity = { type: 'LINE', points: [startPoint, endPoint], layer: activeLayer };
            } else if (activeTool === 'rect') {
                newEntity = { type: 'RECT', points: [startPoint, endPoint], layer: activeLayer };
            } else if (activeTool === 'circle') {
                const r = Math.sqrt((endPoint.x - startPoint.x) ** 2 + (endPoint.y - startPoint.y) ** 2);
                newEntity = { type: 'CIRCLE', x: startPoint.x, y: startPoint.y, radius: r, layer: activeLayer };
            }

            if (newEntity) {
                addCadEntity(newEntity);
            }

            setIsDrawing(false);
            setStartPoint(null);
            onCommandComplete?.();
        }
    };


    return (
        <div ref={containerRef} className="w-full h-full relative cursor-none overflow-hidden">
            <canvas
                ref={canvasRef}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                className="w-full h-full"
            />
        </div>
    );
}
