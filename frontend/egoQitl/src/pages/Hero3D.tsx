import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export const Hero3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

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

    const modelPath = `${import.meta.env.BASE_URL}assets/model.glb`
    console.log('Loading 3D model from:', modelPath)

    loader.load(
      modelPath, 
      (gltf) => {
        console.log('Model loaded successfully')
        model = gltf.scene
        
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
        
        // Animation loop
        const animate = () => {
          animationId = requestAnimationFrame(animate)
          if (model) {
            model.rotation.y += 0.005
          }
          renderer.render(scene, camera)
        }
        animate()
      },
      (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%')
      },
      (err) => {
        console.error('Error loading 3D model from:', modelPath, err)
        setError(`Gagal memuat model 3D: ${err.message}`)
      }
    )

    camera.position.z = 5

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current) return
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      renderer.dispose()
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [])

  if (error) return null // Fail silently or show error

  return <div ref={containerRef} className="w-full h-full min-h-[300px]" />
}

export default Hero3D
