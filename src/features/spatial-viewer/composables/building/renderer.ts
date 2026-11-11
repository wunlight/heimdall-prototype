import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'

export function useBuildingRenderer(container: HTMLDivElement) {
  const canvasHeight = container.clientHeight
  const canvasWidth = container.clientWidth

  const fov = 45
  const aspectRatio = canvasWidth / canvasHeight
  const nearestDistance = 6
  const furthestDistance = 360

  const camera = new THREE.PerspectiveCamera(fov, aspectRatio, nearestDistance, furthestDistance)
  camera.position.set(0, 40, 100)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  })
  renderer.setSize(canvasWidth, canvasHeight)
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = false
  controls.enablePan = false
  controls.enableZoom = false

  // LOCK OUT VERTICAL ORBIT
  const LOCKED_ANGLE = Math.PI / 3
  controls.minPolarAngle = LOCKED_ANGLE
  controls.maxPolarAngle = LOCKED_ANGLE

  const onWheelScroll = (e: WheelEvent) => {
    e.preventDefault()

    if (e.ctrlKey) {
      const zoomSpeed = 0.1
      const zoomFactor = e.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed
      camera.position.sub(controls.target).multiplyScalar(zoomFactor).add(controls.target)
      controls.update()
      return
    }

    if (e.shiftKey) {
      const scrollSpeed = 0.05
      const deltaX = -e.deltaY * scrollSpeed
      camera.position.x += deltaX
      controls.target.x += deltaX
      controls.update()
      return
    }

    const scrollSpeed = 0.05
    const deltaY = -e.deltaY * scrollSpeed
    camera.position.y += deltaY
    controls.target.y += deltaY
    controls.update()
  }
  renderer.domElement.addEventListener('wheel', onWheelScroll, { passive: false })

  let currentScene: THREE.Scene | null = null
  let animationFrame: number | null = null

  const animate = () => {
    animationFrame = requestAnimationFrame(animate)
    controls.update()
    if (currentScene) {
      renderer.render(currentScene, camera)
    }
  }

  const attachScene = (scene: THREE.Scene) => {
    currentScene = scene

    if (animationFrame === null) {
      animate()
    }
  }

  const detachScene = () => {
    currentScene = null
  }

  const dispose = () => {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }

    renderer.domElement.removeEventListener('wheel', onWheelScroll)

    controls.dispose()
    renderer.dispose()

    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }

    currentScene = null
  }

  return {
    camera,
    controls,
    attachScene,
    detachScene,
    dispose,
  }
}
