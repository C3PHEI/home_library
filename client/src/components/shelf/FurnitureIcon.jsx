import { furnitureIconEntry, furnitureIconKey } from '../../utils/icons.js'

// Icon eines Möbels: eigenes Icon oder Standard nach Typ
export default function FurnitureIcon({ furniture, size = 18 }) {
    const { Icon } = furnitureIconEntry(furnitureIconKey(furniture))
    return <Icon size={size} aria-hidden="true" />
}