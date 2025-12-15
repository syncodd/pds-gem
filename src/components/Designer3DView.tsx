'use client';

import { useEffect, useRef } from 'react';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  MeshBuilder,
  Vector3,
  StandardMaterial,
  Color3,
  Color4,
  Mesh,
} from '@babylonjs/core';
import { FramingBehavior } from '@babylonjs/core/Behaviors/Cameras/framingBehavior';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders/glTF';
import '@babylonjs/loaders/OBJ';
import '@babylonjs/loaders/STL';
import { usePanelStore } from '@/lib/store';

export default function Designer3DView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const panelMeshRef = useRef<Mesh | null>(null);
  const componentMeshesRef = useRef<Map<string, Mesh[]>>(new Map());

  const { panels, components, componentLibrary, selectedCanvasComponent, activePanelId } = usePanelStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const container = canvas.parentElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width || 400;
      canvas.height = rect.height || 400;
    }

    // Create engine
    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
    });
    engineRef.current = engine;

    // Create scene
    const scene = new Scene(engine);
    sceneRef.current = scene;
    scene.clearColor = new Color4(0.97, 0.97, 0.97, 1);
    scene.ambientColor = new Color3(0.3, 0.3, 0.3);

    if (panels.length === 0) return;

    // Calculate panel positions and dimensions
    const panelPositions = panels.map((panel, index) => {
      const xOffset = panels
        .slice(0, index)
        .reduce((sum, p) => sum + p.width, 0); // No spacing - panels are adjacent
      return {
        panel,
        xOffset,
        width: panel.width * 0.1,
        height: panel.height * 0.1,
        depth: (panel.depth || 200) * 0.1,
      };
    });

    const totalWidth = panelPositions.reduce((sum, p) => sum + p.width, 0);
    const maxHeight = Math.max(...panelPositions.map((p) => p.height));
    const maxDepth = Math.max(...panelPositions.map((p) => p.depth));
    const maxDimension = Math.max(totalWidth, maxHeight, maxDepth);

    // Create camera
    const camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2.3,
      Math.PI / 3.2,
      maxDimension * 2.8,
      Vector3.Zero(),
      scene
    );
    camera.attachControl(canvas, true);
    camera.wheelDeltaPercentage = 0.01;
    camera.panningSensibility = 50;
    camera.angularSensibilityX = 2000;
    camera.angularSensibilityY = 2000;

    // Enable framing behavior
    const framingBehavior = new FramingBehavior();
    framingBehavior.framingTime = 0;
    framingBehavior.elevationReturnTime = -1;
    framingBehavior.zoomOnBoundingInfo = true;
    camera.addBehavior(framingBehavior);

    // Create lighting
    const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.8;
    hemiLight.diffuse = new Color3(1, 1, 1);
    hemiLight.specular = new Color3(0.5, 0.5, 0.5);

    const dirLight = new DirectionalLight('dirLight', new Vector3(-1, -1, -0.5), scene);
    dirLight.intensity = 0.6;
    dirLight.diffuse = new Color3(1, 1, 1);
    dirLight.specular = new Color3(0.3, 0.3, 0.3);

    const fillLight = new DirectionalLight('fillLight', new Vector3(1, 0.5, 0.5), scene);
    fillLight.intensity = 0.3;
    fillLight.diffuse = new Color3(1, 1, 1);

    // Create panel frames for all panels
    const createPanelFrames = () => {
      // Clear existing panel meshes
      scene.meshes.forEach((mesh) => {
        if (mesh.name.startsWith('panel_') || mesh.name.startsWith('edge_')) {
          mesh.dispose();
        }
      });

      panelPositions.forEach(({ panel, xOffset, width, height, depth }, index) => {
        const isActive = activePanelId === panel.id;
        // Calculate panel's center X position in 3D space (convert mm to scene units)
        const panelCenterX = (xOffset + panel.width / 2) * 0.1;
        const totalWidthCenter = (totalWidth / 2) * 0.1;
        const panelX = panelCenterX - totalWidthCenter;

        // Create panel box (transparent or very light)
        const panelBox = MeshBuilder.CreateBox(`panel_frame_${panel.id}`, { width, height, depth }, scene);
        panelBox.position = new Vector3(panelX, 0, 0);

        const panelMaterial = new StandardMaterial(`panelMaterial_${panel.id}`, scene);
        panelMaterial.diffuseColor = new Color3(0.9, 0.9, 0.9);
        panelMaterial.alpha = 0.1; // Very transparent
        panelBox.material = panelMaterial;

        // Create edge outline (red wireframe, blue if active)
        const createEdgeOutline = () => {
          const edges = [
            // Bottom face edges
            [new Vector3(-width / 2, -height / 2, -depth / 2), new Vector3(width / 2, -height / 2, -depth / 2)],
            [new Vector3(width / 2, -height / 2, -depth / 2), new Vector3(width / 2, -height / 2, depth / 2)],
            [new Vector3(width / 2, -height / 2, depth / 2), new Vector3(-width / 2, -height / 2, depth / 2)],
            [new Vector3(-width / 2, -height / 2, depth / 2), new Vector3(-width / 2, -height / 2, -depth / 2)],
            // Top face edges
            [new Vector3(-width / 2, height / 2, -depth / 2), new Vector3(width / 2, height / 2, -depth / 2)],
            [new Vector3(width / 2, height / 2, -depth / 2), new Vector3(width / 2, height / 2, depth / 2)],
            [new Vector3(width / 2, height / 2, depth / 2), new Vector3(-width / 2, height / 2, depth / 2)],
            [new Vector3(-width / 2, height / 2, depth / 2), new Vector3(-width / 2, height / 2, -depth / 2)],
            // Vertical edges
            [new Vector3(-width / 2, -height / 2, -depth / 2), new Vector3(-width / 2, height / 2, -depth / 2)],
            [new Vector3(width / 2, -height / 2, -depth / 2), new Vector3(width / 2, height / 2, -depth / 2)],
            [new Vector3(width / 2, -height / 2, depth / 2), new Vector3(width / 2, height / 2, depth / 2)],
            [new Vector3(-width / 2, -height / 2, depth / 2), new Vector3(-width / 2, height / 2, depth / 2)],
          ];

          edges.forEach((edge, edgeIndex) => {
            const adjustedEdge = edge.map((point) => point.add(new Vector3(panelX, 0, 0)));
            const line = MeshBuilder.CreateLines(`edge_${panel.id}_${edgeIndex}`, { points: adjustedEdge }, scene);
            line.color = isActive ? new Color3(0.15, 0.4, 0.9) : new Color3(1, 0, 0); // Blue if active, red otherwise
          });
        };

        createEdgeOutline();

        // Try to load 3D model if available
        if (panel.model3D && (panel.model3D.startsWith('http') || panel.model3D.startsWith('/') || panel.model3D.startsWith('blob:'))) {
          loadPanel3DModel(panel, panelX);
        }
      });
    };

    // Load panel 3D model
    const loadPanel3DModel = async (panel: Panel, panelX: number) => {
      const url = panel.model3D!;
      try {
        let result;
        if (url.startsWith('blob:')) {
          result = await SceneLoader.ImportMeshAsync('', url, '', scene);
        } else if (url.startsWith('/')) {
          const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;
          const urlObj = new URL(fullUrl);
          const pathname = urlObj.pathname;
          const lastSlashIndex = pathname.lastIndexOf('/');
          const fileName = pathname.substring(lastSlashIndex + 1);
          const rootPath = fullUrl.substring(0, fullUrl.lastIndexOf('/') + 1);
          result = await SceneLoader.ImportMeshAsync('', rootPath, fileName, scene);
        } else {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/');
          const fileName = pathParts[pathParts.length - 1];
          const rootPath = url.substring(0, url.lastIndexOf('/') + 1);
          result = await SceneLoader.ImportMeshAsync('', rootPath, fileName, scene);
        }

        if (result.meshes.length > 0) {
          // Scale and center the panel model (similar to Panel3DView logic)
          const validMeshes = result.meshes.filter(mesh => {
            const boundingInfo = mesh.getBoundingInfo();
            const min = boundingInfo.boundingBox.minimumWorld;
            const max = boundingInfo.boundingBox.maximumWorld;
            const size = max.subtract(min);
            return size.x > 0 && size.y > 0 && size.z > 0 &&
                   isFinite(size.x) && isFinite(size.y) && isFinite(size.z);
          });

          if (validMeshes.length > 0) {
            // Calculate bounding box and scale
            let min = validMeshes[0].getBoundingInfo().boundingBox.minimumWorld;
            let max = validMeshes[0].getBoundingInfo().boundingBox.maximumWorld;
            for (let i = 1; i < validMeshes.length; i++) {
              const meshMin = validMeshes[i].getBoundingInfo().boundingBox.minimumWorld;
              const meshMax = validMeshes[i].getBoundingInfo().boundingBox.maximumWorld;
              min = Vector3.Minimize(min, meshMin);
              max = Vector3.Maximize(max, meshMax);
            }

            const center = min.add(max).scale(0.5);
            const modelSize = max.subtract(min);
            const modelDimensions = [
              { axis: 'width', size: modelSize.x, panelSize: panel.width * 0.1 },
              { axis: 'height', size: modelSize.y, panelSize: panel.height * 0.1 },
              { axis: 'depth', size: modelSize.z, panelSize: (panel.depth || 200) * 0.1 }
            ];
            modelDimensions.sort((a, b) => b.size - a.size);
            const longestAxis = modelDimensions[0];
            const scaleFactor = longestAxis.panelSize / longestAxis.size;

            result.meshes.forEach((mesh) => {
              mesh.position.subtractInPlace(center);
              mesh.position.addInPlace(new Vector3(panelX, 0, 0));
              mesh.scaling = new Vector3(scaleFactor, scaleFactor, scaleFactor);
              mesh.refreshBoundingInfo();
            });

            // Remove placeholder box for this panel
            const placeholderBox = scene.getMeshByName(`panel_frame_${panel.id}`);
            if (placeholderBox) {
              placeholderBox.dispose();
            }
          }
        }
      } catch (error) {
        console.error('Error loading panel 3D model:', error);
      }
    };

    // Create component mesh
    const createComponentMesh = (canvasComp: any, compDef: any) => {
      const compWidth = compDef.width * 0.1;
      const compHeight = compDef.height * 0.1;
      const compDepth = (compDef.depth || 15) * 0.1;

      // Find the panel this component belongs to
      const panelPos = panelPositions.find((p) => p.panel.id === canvasComp.panelId);
      if (!panelPos) return null;

      // Position: Convert 2D canvas position to 3D
      // In 2D: (0,0) is top-left, x increases right, y increases down
      // In 3D: Panels are centered at origin, components positioned relative to panel bottom-left
      // Calculate panel's left edge X position in 3D space (convert mm to scene units)
      const panelLeftX = panelPos.xOffset * 0.1;
      const totalWidthCenter = (totalWidth / 2) * 0.1;
      const panelX = panelLeftX - totalWidthCenter;
      
      // Component position: 
      // X: panel left edge + component x offset (from panel's left edge)
      // Y: panel is centered at y=0, so convert top-left coords to centered space
      // Z: on front face of panel
      const x = panelX + canvasComp.x * 0.1 + compWidth / 2;
      const y = (panelPos.panel.height / 2 - canvasComp.y - compDef.height / 2) * 0.1; // Flip Y and recentre around panel origin
      const z = panelPos.depth / 2 + compDepth / 2; // Place on front face

      const box = MeshBuilder.CreateBox(
        `component_${canvasComp.id}`,
        { width: compWidth, height: compHeight, depth: compDepth },
        scene
      );
      box.position = new Vector3(x, y, z);

      // Use component color
      const color = Color3.FromHexString(compDef.color || '#4a90e2');
      const material = new StandardMaterial(`compMaterial_${canvasComp.id}`, scene);
      material.diffuseColor = color;
      material.specularColor = new Color3(0.2, 0.2, 0.2);
      box.material = material;

      // Highlight if selected
      if (selectedCanvasComponent === canvasComp.id) {
        material.emissiveColor = new Color3(0.2, 0.4, 0.8);
      }

      return box;
    };

    // Load component 3D model
    const loadComponent3DModel = async (canvasComp: any, compDef: any, mesh: Mesh) => {
      if (!compDef.model3D || (!compDef.model3D.startsWith('http') && !compDef.model3D.startsWith('/') && !compDef.model3D.startsWith('blob:'))) {
        return;
      }

      try {
        const url = compDef.model3D;
        let result;
        
        if (url.startsWith('blob:')) {
          result = await SceneLoader.ImportMeshAsync('', url, '', scene);
        } else if (url.startsWith('/')) {
          const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;
          const urlObj = new URL(fullUrl);
          const pathname = urlObj.pathname;
          const lastSlashIndex = pathname.lastIndexOf('/');
          const fileName = pathname.substring(lastSlashIndex + 1);
          const rootPath = fullUrl.substring(0, fullUrl.lastIndexOf('/') + 1);
          result = await SceneLoader.ImportMeshAsync('', rootPath, fileName, scene);
        } else {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/');
          const fileName = pathParts[pathParts.length - 1];
          const rootPath = url.substring(0, url.lastIndexOf('/') + 1);
          result = await SceneLoader.ImportMeshAsync('', rootPath, fileName, scene);
        }

        if (result.meshes.length > 0) {
          // Remove placeholder box
          mesh.dispose();

          // Position and scale the loaded model
          const panelPos = panelPositions.find((p) => p.panel.id === canvasComp.panelId);
          if (!panelPos) return;

          const compWidth = compDef.width * 0.1;
          const compHeight = compDef.height * 0.1;
          const compDepth = (compDef.depth || 15) * 0.1;
          
          // Position: Convert 2D canvas position to 3D (same as createComponentMesh)
          // Calculate panel's left edge X position in 3D space (convert mm to scene units)
          const panelLeftX = panelPos.xOffset * 0.1;
          const totalWidthCenter = (totalWidth / 2) * 0.1;
          const panelX = panelLeftX - totalWidthCenter;
          
          // Component position: same calculation as createComponentMesh
          const x = panelX + canvasComp.x * 0.1 + compWidth / 2;
          const y = (panelPos.panel.height / 2 - canvasComp.y - compDef.height / 2) * 0.1; // Center Y in panel space
          const z = panelPos.depth / 2 + compDepth / 2;

          // Calculate bounding box and scale
          const validMeshes = result.meshes.filter(m => {
            const bi = m.getBoundingInfo();
            const s = bi.boundingBox.maximumWorld.subtract(bi.boundingBox.minimumWorld);
            return s.x > 0 && s.y > 0 && s.z > 0;
          });

          if (validMeshes.length > 0) {
            let min = validMeshes[0].getBoundingInfo().boundingBox.minimumWorld;
            let max = validMeshes[0].getBoundingInfo().boundingBox.maximumWorld;
            for (let i = 1; i < validMeshes.length; i++) {
              const m = validMeshes[i].getBoundingInfo().boundingBox;
              min = Vector3.Minimize(min, m.minimumWorld);
              max = Vector3.Maximize(max, m.maximumWorld);
            }

            const center = min.add(max).scale(0.5);
            const modelSize = max.subtract(min);
            const maxSize = Math.max(modelSize.x, modelSize.y, modelSize.z);
            const compMaxSize = Math.max(compWidth, compHeight, compDepth);
            const scaleFactor = compMaxSize / maxSize;

            result.meshes.forEach((m) => {
              m.position.subtractInPlace(center);
              m.position.addInPlace(new Vector3(x, y, z));
              m.scaling = new Vector3(scaleFactor, scaleFactor, scaleFactor);
              m.refreshBoundingInfo();
            });

            // Store meshes for cleanup
            const meshes = componentMeshesRef.current.get(canvasComp.id) || [];
            meshes.push(...result.meshes);
            componentMeshesRef.current.set(canvasComp.id, meshes);
          }
        }
      } catch (error) {
        console.error('Error loading component 3D model:', error);
      }
    };

    // Render components
    const renderComponents = () => {
      // Clear existing component meshes
      componentMeshesRef.current.forEach((meshes) => {
        meshes.forEach((mesh) => mesh.dispose());
      });
      componentMeshesRef.current.clear();

      components.forEach((canvasComp) => {
        const compDef = componentLibrary.find((c) => c.id === canvasComp.componentId);
        if (!compDef) return;

        // Create placeholder or load 3D model
        const placeholder = createComponentMesh(canvasComp, compDef);
        if (placeholder) {
          if (compDef.model3D) {
            loadComponent3DModel(canvasComp, compDef, placeholder);
          } else {
            componentMeshesRef.current.set(canvasComp.id, [placeholder]);
          }
        }
      });
    };

    // Initial render
    createPanelFrames();
    renderComponents();

    // Render loop
    engine.runRenderLoop(() => {
      if (scene) {
        scene.render();
      }
    });

    // Handle resize
    const handleResize = () => {
      if (container) {
        const rect = container.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          canvas.width = rect.width;
          canvas.height = rect.height;
          engine.resize();
        }
      } else {
        engine.resize();
      }
    };

    let resizeObserver: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(container);
    }

    window.addEventListener('resize', handleResize);
    setTimeout(() => {
      handleResize();
    }, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver && container) {
        resizeObserver.unobserve(container);
        resizeObserver.disconnect();
      }
      componentMeshesRef.current.forEach((meshes) => {
        meshes.forEach((mesh) => mesh.dispose());
      });
      componentMeshesRef.current.clear();
      // Dispose all panel meshes
      scene.meshes.forEach((mesh) => {
        if (mesh.name.startsWith('panel_') || mesh.name.startsWith('edge_')) {
          mesh.dispose();
        }
      });
      if (sceneRef.current) {
        sceneRef.current.cameras.forEach((cam) => {
          cam.detachControl();
        });
        sceneRef.current.dispose();
      }
      if (engineRef.current) {
        engineRef.current.dispose();
      }
    };
  }, [panels, components, componentLibrary, selectedCanvasComponent, activePanelId]);

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ touchAction: 'none', outline: 'none', display: 'block' }}
      />
    </div>
  );
}

