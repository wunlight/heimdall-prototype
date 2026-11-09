# Heimdall Prototype

Heimdall is a spatial monitoring prototype designed to visualize fire incidents across multi-floor building layouts. It provides interactive 2D and 3D spatial views to represent building structures, floor plans, and device locations, with the goal of supporting real-time incident monitoring and event replay.

---

## Technologies

- **Core:** Vue 3, TypeScript, Three.js, Leaflet.js
- **UI & Styling:** PrimeVue, Tailwind CSS

---

## Features

### 1. Dual-View Spatial Visualization

- 3D View: Hierarchical building and floor visualization using Three.js.
- 2D View: Floor plan visualization using Leaflet.js and image overlays.
- Device Positioning: Represents spatial device locations within building layouts.

### 2. Programmatic Camera Control

- Automated camera positioning based on predefined spatial targets.
- Absolute camera movement to navigate between spatial coordinates and viewpoints.
- Relative orbital movement to adjust camera orientation.
- Configurable camera parameters, including azimuth, elevation, distance, and transition duration.
- Camera control across both 3D spatial models and 2D floor plans.

### 3. Spatial Command Queue

- Structured commands for controlling spatial viewer behavior.
- Support for camera movement and view transitions.
- Absolute and relative movement handling for 3D camera commands.
- Command execution through a centralized spatial viewer interface.

## Work In Progress

The following components are currently under development:
- WebSocket Integration: Connecting incoming event payloads to the spatial command execution system.
- Event Simulation: Simulating fire incidents and sequential device activations.
- Event Replay Engine: Replaying chronological incident timelines and visualizing device activation sequences.
- Spatial Event Synchronization: Coordinating building, floor, and device context with incoming spatial commands.

## Live Demo

https://heimdall-prototype.vercel.app/

The prototype includes an interactive camera movement demonstration that can be triggered through the Run Camera Demo button.

Note: Heimdall is currently a development prototype. Some interactions and automated workflows are still under development.
