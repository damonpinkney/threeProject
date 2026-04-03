import * as THREE from 'three'
import { useRef } from 'react'
import { useHelper } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'



export default function ThreeElement() {
    const {size, gl, scene, camera} = useThree()
    const boxRef = useRef<THREE.Mesh>(null)
    const sLight = useRef<THREE.SpotLight>(null!)
    useHelper(sLight, THREE.SpotLightHelper)

    useFrame((state, delta) => {
        boxRef.current.rotation.z += delta
        
        
        


    })



    return (
        <>
        <directionalLight position={[5,5,5]} intensity={1} />

        <spotLight
        castShadow
        ref={sLight}
                color={'#fff'} 
                position={[0,5,0]} 
                intensity={300}
                distance={10}
                angle={THREE.MathUtils.degToRad(40)}
                target-position={[0,0,0]}
                penumbra={0.5} />

                <mesh 
                rotation-x={[THREE.MathUtils.degToRad(-90)]}
                position-y={-1}
                receiveShadow
            >
                <planeGeometry args={[15,15]}/>
                <meshStandardMaterial color={'#020059'} side={THREE.DoubleSide}/>
            </mesh>


        <mesh
        ref={boxRef}
        position={[0,0,0]} 
        > 
        <boxGeometry />
        <meshStandardMaterial
        color={'red'} />
        </mesh>
        </>
    )
}