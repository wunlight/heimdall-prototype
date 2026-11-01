import type { Floor } from '@/types/entity.type'
import {
  BoxGeometry,
  DoubleSide,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import { onUnmounted } from 'vue'

export function useBuildingScene(container: HTMLDivElement) {
  const scene = new Scene()

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

  renderer.domElement.addEventListener(
    'wheel',
    (e) => {
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
    },
    { passive: false },
  )

  const texture = new TextureLoader()
  const floorLayers: Mesh[] = []
  const floorAreas: Mesh[] = []

  const insertFloorLayer = (
    img: string,
    yPos: number,
    baseScale: number,
  ): Promise<{ width: number; depth: number }> => {
    return new Promise((resolve) => {
      texture.load(img, (texture) => {
        const imgHeight = texture.image.height
        const imgWidth = texture.image.width
        const imgAspect = imgWidth / imgHeight

        const planeWidth = baseScale
        const planeDepth = baseScale / imgAspect

        const geometry = new PlaneGeometry(planeWidth, planeDepth)
        const material = new MeshBasicMaterial({
          map: texture,
          side: DoubleSide,
          transparent: true,
        })

        const plane = new Mesh(geometry, material)
        plane.rotation.x = -Math.PI / 2
        plane.position.y = yPos

        scene.add(plane)
        floorLayers.push(plane)

        resolve({ width: planeWidth, depth: planeDepth })
      })
    })
  }

  const insertFloorArea = (
    floor: Floor,
    yPos: number,
    width: number = 40,
    depth: number = 30,
    height: number,
    initialColor: string,
  ) => {
    const geometry = new BoxGeometry(width, height, depth)
    geometry.translate(0, height / 2, 0)

    const material = new MeshBasicMaterial({
      color: initialColor,
      transparent: true,
      opacity: 0.3,
      wireframe: false,
    })

    const box = new Mesh(geometry, material)
    box.position.y = yPos
    box.userData = { ...floor }

    const edges = new EdgesGeometry(geometry)
    const line = new LineBasicMaterial({
      color: initialColor,
      linewidth: 2,
      transparent: true,
      opacity: 0.8,
    })
    const edgeLines = new LineSegments(edges, line)
    box.add(edgeLines)

    scene.add(box)
    floorAreas.push(box)
  }

  const loadFloor = async (
    floor: Floor,
    yPos: number,
    baseScale: number = 40,
    height: number = 10,
    initialColor: string = '#62748e',
  ) => {
    const { width, depth } = await insertFloorLayer(floor.blueprint_url, yPos, baseScale)
    insertFloorArea(floor, yPos, width, depth, height, initialColor)
  }

  const raycaster = new Raycaster()
  const mouse = new Vector2()

  const onFloorClick = (e: MouseEvent, cb?: (floor: Floor) => void) => {
    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = ((e.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(floorAreas)

    if (intersects[0]) {
      const clickedObject = intersects[0].object
      const floor = clickedObject.userData.floor
      if (cb) cb(floor)
    }
  }

  let hoveredMesh: null | Mesh = null
  const onPointerMove = (e: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = ((e.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(floorAreas)

    if (intersects[0]) {
      const hoveredObject = intersects[0].object as Mesh
      if (hoveredMesh !== hoveredObject) {
        if (hoveredMesh) {
          const prevMat = hoveredMesh.material as MeshBasicMaterial
          prevMat.opacity = 0.3
        }
        hoveredMesh = hoveredObject
        const currMat = hoveredMesh.material as MeshBasicMaterial
        currMat.opacity = 0.6
      }
    } else if (hoveredMesh) {
      const prevMat = hoveredMesh.material as MeshBasicMaterial
      prevMat.opacity = 0.3
      hoveredMesh = null
    }
  }
  renderer.domElement.addEventListener('pointermove', onPointerMove)

  let animationFrame: number | null = null
  function animate() {
    animationFrame = requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }
  animate()

  onUnmounted(() => {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame)
    }
    controls.dispose()
    renderer.dispose()
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  })

  return {
    loadFloor,
    onFloorClick,
  }
}
