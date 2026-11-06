import type { Floor } from '@/shared/types/entity.type'
import type { Mesh, Scene } from 'three'
import { PerspectiveCamera, Raycaster, Vector2, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'

export interface BuildingRendererController {
  attachScene: (scene: Scene, floorAreas: Mesh[]) => void
  detachScene: () => void
  dispose: () => void
  onFloorClick: (cb: (floor: Floor) => void) => void
}

export function useBuildingRenderer(container: HTMLDivElement): BuildingRendererController {
  const CANVAS_HEIGHT = container.clientHeight
  const CANVAS_WIDTH = container.clientWidth
  const FIELD_OF_VIEW = 45
  const SCREEN_ASPECT = CANVAS_WIDTH / CANVAS_HEIGHT
  const RENDER_NEAR_DISTANCE = 6
  const RENDER_FAR_DISTANCE = 360

  const camera = new PerspectiveCamera(
    FIELD_OF_VIEW,
    SCREEN_ASPECT,
    RENDER_NEAR_DISTANCE,
    RENDER_FAR_DISTANCE,
  )
  camera.position.set(0, 40, 100)
  camera.lookAt(0, 0, 0)

  const renderer = new WebGLRenderer({ alpha: true, antialias: true })
  renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT)
  renderer.setClearColor(0x000000, 0)
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.enablePan = false
  controls.enableZoom = false

  // LOCK OUT VERTICAL ORBIT
  const LOCKED_ANGLE = Math.PI / 3
  controls.minPolarAngle = LOCKED_ANGLE
  controls.maxPolarAngle = LOCKED_ANGLE

  // CURRENT ATTACHED SCENE
  let currentScene: Scene | null = null
  let currentFloorAreas: Mesh[] = []
  let animationFrame: number | null = null
  let clickCallback: ((floor: Floor) => void) | null = null

  const onScroll = (e: WheelEvent) => {
    e.preventDefault()

    // ZOOM CONTROL
    if (e.ctrlKey) {
      const zoomSpeed = 0.1
      const zoomFactor = e.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed
      camera.position.sub(controls.target).multiplyScalar(zoomFactor).add(controls.target)
      controls.update()
      return
    }

    // HORIZONTAL PAN CONTROL
    if (e.shiftKey) {
      const scrollSpeed = 0.05
      const deltaX = -e.deltaY * scrollSpeed
      camera.position.x += deltaX
      controls.target.x += deltaX
      controls.update()
      return
    }

    // VERTICAL PAN CONTROL
    const scrollSpeed = 0.05
    const deltaY = -e.deltaY * scrollSpeed
    camera.position.y += deltaY
    controls.target.y += deltaY
    controls.update()
  }

  const raycaster = new Raycaster()
  const mouse = new Vector2()

  const onFloorClick = (e: MouseEvent) => {
    if (!clickCallback || !currentFloorAreas.length) return

    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(currentFloorAreas)

    if (intersects[0]) {
      const clickedObject = intersects[0].object
      const floor = clickedObject.userData.floor
      if (floor && clickCallback) clickCallback(floor)
    }
  }

  let hoveredMesh: Mesh | null = null
  const onPointerMove = (e: PointerEvent) => {
    if (!currentFloorAreas.length) return

    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(currentFloorAreas)

    if (intersects[0]) {
      const hoveredObject = intersects[0].object as Mesh
      if (hoveredMesh !== hoveredObject) {
        if (hoveredMesh) {
          const prevMat = hoveredMesh.material as { opacity: number }
          if (prevMat) prevMat.opacity = 0.3
        }
        hoveredMesh = hoveredObject
        const currMat = hoveredMesh.material as { opacity: number }
        if (currMat) currMat.opacity = 0.6
      }
    } else {
      if (hoveredMesh) {
        const prevMat = hoveredMesh.material as { opacity: number }
        if (prevMat) prevMat.opacity = 0.3
        hoveredMesh = null
      }
    }
  }

  renderer.domElement.addEventListener('wheel', onScroll, { passive: false })
  renderer.domElement.addEventListener('pointermove', onPointerMove)

  const animate = () => {
    animationFrame = requestAnimationFrame(animate)
    controls.update()
    if (currentScene) {
      renderer.render(currentScene, camera)
    }
  }

  const attachScene = (scene: Scene, floorAreas: Mesh[]) => {
    hoveredMesh = null
    currentScene = scene
    currentFloorAreas = floorAreas

    currentFloorAreas.forEach((mesh) => {
      const mat = mesh.material as { opacity: number }
      if (mat) {
        mat.opacity = 0.3
      }
    })

    if (animationFrame === null) {
      animate()
    }
  }

  const detachScene = () => {
    hoveredMesh = null
    currentScene = null
    currentFloorAreas = []
  }

  const dispose = () => {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }

    renderer.domElement.removeEventListener('wheel', onScroll)
    renderer.domElement.removeEventListener('pointermove', onPointerMove)

    controls.dispose()
    renderer.dispose()

    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }

    currentScene = null
    currentFloorAreas = []
    clickCallback = null
    hoveredMesh = null
  }

  const setClickCallback = (cb: (floor: Floor) => void) => {
    renderer.domElement.addEventListener('click', onFloorClick)
    clickCallback = cb
  }

  return {
    attachScene,
    detachScene,
    dispose,
    onFloorClick: setClickCallback,
  }
}
