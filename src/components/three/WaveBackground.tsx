import React, { useRef, useMemo, useEffect, useState } from 'react'
import * as THREE from 'three'

interface WaveBackgroundProps {
  className?: string
}

export const WaveBackground: React.FC<WaveBackgroundProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isSupported, setIsSupported] = useState(true)
  const [fps, setFps] = useState(60)
  const animationRef = useRef<number>()
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()
  const meshRef = useRef<THREE.Mesh>()

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setIsSupported(false)
      return
    }

    if (!canvasRef.current) return

    try {
      // Initialize Three.js scene
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
      const renderer = new THREE.WebGLRenderer({ 
        canvas: canvasRef.current, 
        alpha: true,
        antialias: false // Disable for better performance
      })

      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Limit pixel ratio for performance

      // Create wave geometry
      const geometry = new THREE.PlaneGeometry(20, 20, 32, 32)
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x10B981, 
        wireframe: true, 
        transparent: true, 
        opacity: 0.3 
      })
      const mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)

      camera.position.z = 10

      // Store references
      sceneRef.current = scene
      rendererRef.current = renderer
      cameraRef.current = camera
      meshRef.current = mesh

      // FPS monitoring
      let lastTime = performance.now()
      let frameCount = 0

      const animate = () => {
        const currentTime = performance.now()
        frameCount++

        // Update FPS every second
        if (currentTime - lastTime >= 1000) {
          const currentFps = Math.round((frameCount * 1000) / (currentTime - lastTime))
          setFps(currentFps)
          
          // Disable animation if FPS is too low
          if (currentFps < 30) {
            setIsSupported(false)
            return
          }
          
          frameCount = 0
          lastTime = currentTime
        }

        if (meshRef.current) {
          const time = currentTime * 0.001
          const positionAttribute = meshRef.current.geometry.attributes.position
          
          for (let i = 0; i < positionAttribute.count; i++) {
            const x = positionAttribute.getX(i)
            const y = positionAttribute.getY(i)
            const z = Math.sin(x * 0.5 + time) * Math.cos(y * 0.5 + time) * 0.5
            positionAttribute.setZ(i, z)
          }
          
          positionAttribute.needsUpdate = true
          meshRef.current.rotation.z = time * 0.1
        }

        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current)
        }

        animationRef.current = requestAnimationFrame(animate)
      }

      animate()

      // Handle resize
      const handleResize = () => {
        if (cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = window.innerWidth / window.innerHeight
          cameraRef.current.updateProjectionMatrix()
          rendererRef.current.setSize(window.innerWidth, window.innerHeight)
        }
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
        if (rendererRef.current) {
          rendererRef.current.dispose()
        }
        if (meshRef.current) {
          meshRef.current.geometry.dispose()
          if (meshRef.current.material instanceof THREE.Material) {
            meshRef.current.material.dispose()
          }
        }
      }
    } catch (error) {
      console.warn('Three.js initialization failed:', error)
      setIsSupported(false)
    }
  }, [])

  if (!isSupported) {
    // Fallback to CSS gradient
    return (
      <div 
        className={`absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 ${className}`}
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(14, 165, 233, 0.2) 100%)'
        }}
      />
    )
  }

  return (
    <canvas 
      ref={canvasRef}
      className={`absolute inset-0 ${className}`}
      style={{ pointerEvents: 'none' }}
    />
  )
}