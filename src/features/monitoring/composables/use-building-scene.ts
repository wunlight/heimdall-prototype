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

let globalScene: Scene | null = null
let globalCamera: PerspectiveCamera | null = null
let globalRenderer: WebGLRenderer | null = null
let globalControls: OrbitControls | null = null
let globalTextureLoader: TextureLoader | null = null
let globalAnimationFrameId: number | null = null

export const useBuildingScene = (container: HTMLDivElement) => {
  const { camera, controls, renderer, scene, textureLoader } = initGlobalScene(container)

  const floorMeshes: Mesh[] = []
  const interactiveAreas: Mesh[] = []

  const loadFloorLayer = (imgSrc: string, yPos: number, baseScale: number = 40) => {
    return new Promise<{ width: number; depth: number }>((resolve) => {
      textureLoader.load(
        imgSrc,
        (texture) => {
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
          floorMeshes.push(plane)

          resolve({ width: planeWidth, depth: planeDepth })
        },
        undefined,
        (e) => {
          console.error(`Failed to load image ${imgSrc}: `, e)
          resolve({ width: 40, depth: 30 })
        },
      )
    })
  }

  const loadFloorArea = (
    yPos: number,
    floorId: string,
    floorName: string,
    boxWidth: number = 40,
    boxHeight: number = 10,
    boxDepth: number = 30,
    defaultColor: string = '#2b7fff',
  ) => {
    const geometry = new BoxGeometry(boxWidth, boxHeight, boxDepth)
    geometry.translate(0, boxHeight / 2, 0)

    const material = new MeshBasicMaterial({
      color: defaultColor,
      transparent: true,
      opacity: 0.3,
      wireframe: false,
    })

    const box = new Mesh(geometry, material)
    box.position.y = yPos
    box.userData = { id: floorId, name: floorName }

    scene.add(box)
    interactiveAreas.push(box)

    const edges = new EdgesGeometry(geometry)
    const line = new LineBasicMaterial({
      color: defaultColor,
      linewidth: 2,
      transparent: true,
      opacity: 0.8,
    })
    const lineSegments = new LineSegments(edges, line)
    box.add(lineSegments)

    return box
  }

  const raycaster = new Raycaster()
  const mouse = new Vector2()

  const handleCanvasClick = (
    event: MouseEvent,
    callback?: (floorId: string, floorName: string) => void,
  ) => {
    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(interactiveAreas)

    if (intersects.length > 0) {
      const clickedObject = intersects[0]!.object as Mesh
      const floorId = clickedObject.userData.id
      const floorName = clickedObject.userData.name
      if (callback) callback(floorId, floorName)
    }
  }

  let hoveredMesh: Mesh | null = null
  const handlePointerMove = (event: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(interactiveAreas)

    if (intersects.length > 0) {
      const currentIntersected = intersects[0]!.object as Mesh

      if (hoveredMesh !== currentIntersected) {
        if (hoveredMesh) {
          const prevMat = hoveredMesh.material as MeshBasicMaterial
          prevMat.opacity = 0.3
        }

        hoveredMesh = currentIntersected
        const currMat = hoveredMesh.material as MeshBasicMaterial
        currMat.opacity = 0.6
      }
    } else {
      if (hoveredMesh) {
        const prevMat = hoveredMesh.material as MeshBasicMaterial
        prevMat.opacity = 0.3
        hoveredMesh = null
      }
    }
  }

  renderer.domElement.addEventListener('pointermove', handlePointerMove)

  const dispose = () => {
    renderer.domElement.removeEventListener('pointermove', handlePointerMove)

    const disposeMaterial = (mat: any) => {
      if (mat.map) mat.map.dispose()
      mat.dispose()
    }

    floorMeshes.forEach((mesh) => {
      scene.remove(mesh)
      mesh.geometry.dispose()
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(disposeMaterial)
      } else {
        disposeMaterial(mesh.material)
      }
    })

    interactiveAreas.forEach((area) => {
      scene.remove(area)
      area.geometry.dispose()
      area.children.forEach((child) => {
        if (child instanceof LineSegments) {
          child.geometry.dispose()
          ;(child.material as LineBasicMaterial).dispose()
        }
      })
      if (Array.isArray(area.material)) {
        area.material.forEach(disposeMaterial)
      } else {
        disposeMaterial(area.material)
      }
    })

    floorMeshes.length = 0
    interactiveAreas.length = 0
  }

  return {
    scene,
    camera,
    renderer,
    loadFloorArea,
    loadFloorLayer,
    handleCanvasClick,
    dispose,
  }
}

const initGlobalScene = (container: HTMLDivElement) => {
  if (globalScene && globalCamera && globalRenderer && globalControls && globalTextureLoader) {
    return {
      scene: globalScene,
      camera: globalCamera,
      renderer: globalRenderer,
      controls: globalControls,
      textureLoader: globalTextureLoader,
    }
  }

  globalScene = new Scene()

  const CONTAINER_HEIGHT = container.clientHeight
  const CONTAINER_WIDTH = container.clientWidth

  const FIELD_OF_VIEW = 45
  const SCREEN_ASPECT = CONTAINER_WIDTH / CONTAINER_HEIGHT
  const RENDER_NEAR_DISTANCE = 6
  const RENDER_FAR_DISTANCE = 360

  globalCamera = new PerspectiveCamera(
    FIELD_OF_VIEW,
    SCREEN_ASPECT,
    RENDER_NEAR_DISTANCE,
    RENDER_FAR_DISTANCE,
  )
  globalCamera.position.set(0, 25, 100)
  globalCamera.lookAt(0, 0, 0)

  globalRenderer = new WebGLRenderer({ antialias: true, alpha: true })
  globalRenderer.setSize(CONTAINER_WIDTH, CONTAINER_HEIGHT)
  globalRenderer.setClearColor(0x000000, 0)
  container.appendChild(globalRenderer.domElement)

  globalControls = new OrbitControls(globalCamera, globalRenderer.domElement)

  globalControls.enableDamping = true
  globalControls.dampingFactor = 0.05

  // LOCK CAMERA ROTATION TO X AXIS
  globalControls.enableRotate = true
  const LOCKED_ANGLE = Math.PI / 3
  globalControls.minPolarAngle = LOCKED_ANGLE
  globalControls.maxPolarAngle = LOCKED_ANGLE

  globalControls.enablePan = false
  globalControls.enableZoom = false

  globalRenderer.domElement.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault()

      if (e.ctrlKey) {
        const zoomSpeed = 0.1
        const zoomFactor = e.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed
        globalCamera!.position
          .sub(globalControls!.target)
          .multiplyScalar(zoomFactor)
          .add(globalControls!.target)
        globalControls!.update()
        return
      }

      if (e.shiftKey) {
        const scrollSpeed = 0.05
        const deltaX = -e.deltaY * scrollSpeed
        globalCamera!.position.x += deltaX
        globalControls!.target.x += deltaX
        globalControls!.update()
        return
      }

      const scrollSpeed = 0.05
      const deltaY = -e.deltaY * scrollSpeed
      globalCamera!.position.y += deltaY
      globalControls!.target.y += deltaY
      globalControls!.update()
    },
    { passive: false },
  )

  globalTextureLoader = new TextureLoader()

  function animate() {
    globalAnimationFrameId = requestAnimationFrame(animate)
    globalControls!.update()
    globalRenderer!.render(globalScene!, globalCamera!)
  }
  animate()

  return {
    scene: globalScene,
    camera: globalCamera,
    renderer: globalRenderer,
    controls: globalControls,
    textureLoader: globalTextureLoader,
  }
}

export const disposeBuildingScene = () => {
  if (globalAnimationFrameId) {
    cancelAnimationFrame(globalAnimationFrameId)
    globalAnimationFrameId = null
  }

  if (globalScene) {
    globalScene.traverse((child) => {
      if (child instanceof Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            if (mat.map) mat.map.dispose()
            mat.dispose()
          })
        } else {
          if (child.material.map) child.material.map.dispose()
          child.material.dispose()
        }
      }
    })
  }

  if (globalControls) globalControls.dispose()
  if (globalRenderer) {
    globalRenderer.dispose()
    if (globalRenderer.domElement?.parentNode) {
      globalRenderer.domElement.parentNode.removeChild(globalRenderer.domElement)
    }
  }

  globalScene = null
  globalCamera = null
  globalRenderer = null
  globalControls = null
  globalTextureLoader = null
}
