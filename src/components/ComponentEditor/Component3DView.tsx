'use client';

import { useEffect, useRef } from 'react';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, DirectionalLight, MeshBuilder, Vector3, StandardMaterial, Color3, Color4 } from '@babylonjs/core';
import { FramingBehavior } from '@babylonjs/core/Behaviors/Cameras/framingBehavior';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
// Import loaders to register them
import '@babylonjs/loaders/glTF';
import '@babylonjs/loaders/OBJ';
import '@babylonjs/loaders/STL';
import { Component } from '@/types';

interface Component3DViewProps {
  component: Component;
}

export default function Component3DView({ component }: Component3DViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    
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

    // Calculate component dimensions for camera setup (convert mm to scene units, 1mm = 0.1 units)
    const width = component.width * 0.1;
    const height = component.height * 0.1;
    const depth = (component.depth || 15) * 0.1;
    const maxDimension = Math.max(width, height, depth);

    // Create camera - better positioning
    const camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2.3,
      Math.PI / 3.2,
      maxDimension * 3,
      Vector3.Zero(),
      scene
    );
    camera.attachControl(canvas, true);
    camera.wheelDeltaPercentage = 0.01;
    camera.panningSensibility = 50;
    camera.angularSensibilityX = 2000;
    camera.angularSensibilityY = 2000;
    
    // Enable framing behavior to automatically fit models
    const framingBehavior = new FramingBehavior();
    framingBehavior.framingTime = 0; // Instant framing
    framingBehavior.elevationReturnTime = -1; // Don't auto-return elevation
    framingBehavior.zoomOnBoundingInfo = true;
    camera.addBehavior(framingBehavior);

    // Create improved lighting setup
    const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.8;
    hemiLight.diffuse = new Color3(1, 1, 1);
    hemiLight.specular = new Color3(0.5, 0.5, 0.5);
    
    // Add directional light for better depth
    const dirLight = new DirectionalLight('dirLight', new Vector3(-1, -1, -0.5), scene);
    dirLight.intensity = 0.6;
    dirLight.diffuse = new Color3(1, 1, 1);
    dirLight.specular = new Color3(0.3, 0.3, 0.3);
    
    // Add fill light from opposite side
    const fillLight = new DirectionalLight('fillLight', new Vector3(1, 0.5, 0.5), scene);
    fillLight.intensity = 0.3;
    fillLight.diffuse = new Color3(1, 1, 1);

    const createEdgeOutline = () => {
      // Clear existing edge meshes
      scene.meshes.forEach((mesh) => {
        if (mesh.name.startsWith('edge_')) {
          mesh.dispose();
        }
      });
      
      // Create red edge outline based on component dimensions
      const edgeBox = MeshBuilder.CreateBox('edge_box', { width: width + 0.1, height: height + 0.1, depth: depth + 0.1 }, scene);
      edgeBox.position = Vector3.Zero();
      const edgeMaterial = new StandardMaterial('edgeMaterial', scene);
      edgeMaterial.wireframe = true;
      edgeMaterial.emissiveColor = new Color3(0.7, 0.15, 0.15);
      edgeMaterial.diffuseColor = new Color3(0.7, 0.15, 0.15);
      edgeMaterial.alpha = 0.4;
      edgeBox.material = edgeMaterial;
    };

    // Load 3D model if available, otherwise create placeholder box
    const load3DModel = async () => {
      // Clear existing meshes
      scene.meshes.forEach((mesh) => {
        if (mesh.name.startsWith('component_') || mesh.name.startsWith('edge_')) {
          mesh.dispose();
        }
      });

      if (component.model3D && (component.model3D.startsWith('http') || component.model3D.startsWith('/') || component.model3D.startsWith('blob:'))) {
        try {
          const url = component.model3D;
          let result;
          
          if (url.startsWith('blob:')) {
            // For blob URLs, load directly
            result = await SceneLoader.ImportMeshAsync('', url, '', scene);
          } else if (url.startsWith('/')) {
            // Local file path (Next.js public folder)
            // For Next.js, files in /public are served from root
            // We need to use the full URL including origin for Babylon.js
            const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;
            // Properly extract filename and root path
            const urlObj = new URL(fullUrl);
            const pathname = urlObj.pathname;
            const lastSlashIndex = pathname.lastIndexOf('/');
            const fileName = pathname.substring(lastSlashIndex + 1);
            const rootPath = fullUrl.substring(0, fullUrl.lastIndexOf('/') + 1);
            console.log('Loading 3D model:', { rootPath, fileName, fullUrl, originalUrl: url });
            result = await SceneLoader.ImportMeshAsync('', rootPath, fileName, scene);
          } else {
            // HTTP URL
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            const fileName = pathParts[pathParts.length - 1];
            const rootPath = url.substring(0, url.lastIndexOf('/') + 1);
            result = await SceneLoader.ImportMeshAsync('', rootPath, fileName, scene);
          }
          
          console.log('3D model loaded, meshes:', result.meshes.length);
          
          if (result.meshes.length > 0) {
            // Filter out meshes without valid bounding info
            const validMeshes = result.meshes.filter(mesh => {
              const boundingInfo = mesh.getBoundingInfo();
              const min = boundingInfo.boundingBox.minimumWorld;
              const max = boundingInfo.boundingBox.maximumWorld;
              const size = max.subtract(min);
              return size.x > 0 && size.y > 0 && size.z > 0 && 
                     isFinite(size.x) && isFinite(size.y) && isFinite(size.z);
            });
            
            if (validMeshes.length === 0) {
              console.warn('3D model loaded but no meshes with valid bounding boxes');
              createPlaceholderBox();
              return;
            }
            
            // Calculate bounding box for all valid meshes
            let min = validMeshes[0].getBoundingInfo().boundingBox.minimumWorld;
            let max = validMeshes[0].getBoundingInfo().boundingBox.maximumWorld;
            
            for (let i = 1; i < validMeshes.length; i++) {
              const meshMin = validMeshes[i].getBoundingInfo().boundingBox.minimumWorld;
              const meshMax = validMeshes[i].getBoundingInfo().boundingBox.maximumWorld;
              min = Vector3.Minimize(min, meshMin);
              max = Vector3.Maximize(max, meshMax);
            }
            
            const size = max.subtract(min);
            const maxSize = Math.max(size.x, size.y, size.z);
            
            // Check for valid size
            if (!isFinite(maxSize) || maxSize <= 0) {
              console.warn('3D model has invalid bounding box size:', maxSize);
              createPlaceholderBox();
              return;
            }
            
            const center = min.add(max).scale(0.5);
            
            // Calculate model dimensions (after centering, these will be relative to origin)
            const modelSize = max.subtract(min);
            const modelWidth = modelSize.x;
            const modelHeight = modelSize.y;
            const modelDepth = modelSize.z;
            
            // Find the longest axis of the model
            const modelDimensions = [
              { axis: 'width', size: modelWidth, componentSize: width },
              { axis: 'height', size: modelHeight, componentSize: height },
              { axis: 'depth', size: modelDepth, componentSize: depth }
            ];
            
            // Sort by model size to find the longest
            modelDimensions.sort((a, b) => b.size - a.size);
            const longestAxis = modelDimensions[0];
            
            // Calculate scale factor: scale the longest axis to match the corresponding component dimension
            const scaleFactor = longestAxis.componentSize / longestAxis.size;
            
            // Center all meshes at origin first
            result.meshes.forEach((mesh) => {
              mesh.position.subtractInPlace(center);
            });
            
            // Apply uniform scale to fit the component dimensions
            result.meshes.forEach((mesh) => {
              mesh.scaling = new Vector3(scaleFactor, scaleFactor, scaleFactor);
            });
            
            // Refresh bounding info after scaling
            result.meshes.forEach((mesh) => {
              mesh.refreshBoundingInfo();
            });
            
            // Remove placeholder box if it exists
            scene.meshes.forEach((mesh) => {
              if (mesh.name.startsWith('component_')) {
                mesh.dispose();
              }
            });
            
            // Create edge outline based on component dimensions
            createEdgeOutline();
            
            // Use framing behavior to automatically fit the camera to the scaled model
            const camera = scene.activeCamera as ArcRotateCamera;
            if (camera) {
              // Set the camera target to the origin (where we centered the model)
              camera.setTarget(Vector3.Zero());
              
              // Use framing behavior to zoom to fit all meshes
              const framingBehavior = camera.behaviors.find(b => b instanceof FramingBehavior) as FramingBehavior;
              if (framingBehavior && result.meshes.length > 0) {
                // Frame the first mesh (framing behavior will handle the view)
                const primaryMesh = result.meshes[0];
                if (primaryMesh) {
                  framingBehavior.zoomOnMesh(primaryMesh, false);
                }
              } else {
                // Fallback: manually set camera radius based on scaled bounding box
                const scaledSize = modelSize.scale(scaleFactor);
                const diagonal = scaledSize.length();
                camera.radius = diagonal * 1.5;
                camera.lowerRadiusLimit = diagonal * 0.5;
                camera.upperRadiusLimit = diagonal * 5;
              }
            }
            
            console.log('Model loaded and scaled to fit component:', { 
              originalSize: maxSize,
              modelDimensions: { width: modelWidth, height: modelHeight, depth: modelDepth },
              componentDimensions: { width, height, depth },
              longestAxis: longestAxis.axis,
              scaleFactor,
              scaledSize: modelSize.scale(scaleFactor).toString(),
              validMeshes: validMeshes.length,
              totalMeshes: result.meshes.length
            });
          } else {
            console.warn('3D model loaded but no meshes found');
            createPlaceholderBox();
          }
        } catch (error) {
          console.error('Error loading 3D model:', error);
          // Fallback to placeholder box
          createPlaceholderBox();
        }
      } else {
        // Create placeholder box
        createPlaceholderBox();
      }
    };

    const createPlaceholderBox = () => {
      // Clear existing placeholder meshes
      scene.meshes.forEach((mesh) => {
        if (mesh.name.startsWith('component_') || mesh.name.startsWith('edge_')) {
          mesh.dispose();
        }
      });
      
      // Create component box (using dimensions calculated above)
      const componentBox = MeshBuilder.CreateBox('component_box', { width, height, depth }, scene);
      componentBox.position = Vector3.Zero();
      
      // Create material for component - use component color
      const color = Color3.FromHexString(component.color);
      const material = new StandardMaterial('componentMaterial', scene);
      material.diffuseColor = color;
      material.specularColor = new Color3(0.5, 0.5, 0.5);
      material.emissiveColor = color.scale(0.1);
      material.ambientColor = color.scale(0.4);
      material.roughness = 0.7;
      componentBox.material = material;

      // Add red edge outline
      createEdgeOutline();

      // Update camera
      const activeCamera = scene.activeCamera as ArcRotateCamera;
      if (activeCamera) {
        activeCamera.radius = maxDimension * 3;
        activeCamera.setTarget(Vector3.Zero());
      }
    };

    load3DModel();

    // Render loop
    engine.runRenderLoop(() => {
      if (scene) {
        scene.render();
      }
    });

    // Handle resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
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
  }, [component.width, component.height, component.depth, component.color, component.model3D]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ touchAction: 'none', outline: 'none' }}
    />
  );
}

