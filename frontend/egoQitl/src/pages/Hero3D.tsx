import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export const Hero3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return

    // Setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    containerRef.current.appendChild(renderer.domElement)
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    // Load Model
    const loader = new GLTFLoader()
    let model: THREE.Group | null = null
    let animationId: number

    // Strategy: Try constructed path first, fallback to root path if needed
    const basePath = import.meta.env.BASE_URL;
    const primaryPath = `${basePath}assets/model.glb`;
    const fallbackPath = '/assets/model.glb';
    
    console.log(`[Hero3D] Base URL: ${basePath}`);
    console.log(`[Hero3D] Primary model path: ${primaryPath}`);

    // Function to attempt loading the model
    const loadModel = async (path: string, isRetry = false) => {
      console.log(`[Hero3D] Attempting to load from: ${path}`);
      
      try {
        // Pre-fetch as blob to check validity and handle network errors explicitly
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        console.log(`[Hero3D] Content-Type: ${contentType}`);
        
        const blob = await response.blob();
        console.log(`[Hero3D] Blob size: ${blob.size} bytes`);
        
        if (blob.size < 1000) {
           // It's likely an error page or empty file
           const text = await blob.text();
           console.error('[Hero3D] File too small, content start:', text.substring(0, 100));
           throw new Error('File too small, likely not a valid GLB model');
        }

        const objectURL = URL.createObjectURL(blob);
        
        loader.load(
          objectURL,
          (gltf) => {
            console.log(`[Hero3D] Model loaded successfully from ${path}`);
            model = gltf.scene;
            
            // Center and scale model
            const box = new THREE.Box3().setFromObject(model)
            const center = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())
            
            // Auto scale to fit view
            const maxDim = Math.max(size.x, size.y, size.z)
            const scale = 3 / maxDim
            model.scale.set(scale, scale, scale)
            
            model.position.sub(center.multiplyScalar(scale))
            
            scene.add(model)
            setIsLoading(false);
            
            // Clean up object URL
            URL.revokeObjectURL(objectURL);
          },
          (xhr) => {
            // Progress handler
            // console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
          },
          (error) => {
            console.error(`[Hero3D] Error parsing GLB from blob:`, error);
            setError(`Failed to parse 3D model: ${error instanceof Error ? error.message : String(error)}`);
            setIsLoading(false);
            URL.revokeObjectURL(objectURL);
          }
        );

      } catch (error) {
        console.error(`[Hero3D] Error fetching ${path}:`, error);
          
        if (!isRetry && path !== fallbackPath) {
          console.log(`[Hero3D] Retrying with fallback path: ${fallbackPath}`);
          loadModel(fallbackPath, true);
          return;
        }

        let errorMessage = 'Failed to load 3D model';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    // Start loading
    loadModel(primaryPath);

    camera.position.z = 5

    // Animation Loop
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      if (model) {
        model.rotation.y += 0.005
      }
      renderer.render(scene, camera)
    }
    animate()

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current) return
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  if (error) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-4">
          <p className="text-red-500 font-semibold mb-2">Error Loading 3D Model</p>
          <p className="text-sm text-gray-600">{error}</p>
          <p className="text-xs text-gray-400 mt-2">Check console for details</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  )
}

export default Hero3D

