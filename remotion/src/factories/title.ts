import { TitleLayerType } from "../schemas/project"
import { v4 as uuidv4 } from "uuid"

export const createTitleLayer = (
  overrides: Partial<TitleLayerType> = {},
): TitleLayerType => {
  return {
    type: "title",
    id: uuidv4(),
    title: "Titre par défaut",
    theme: undefined,
    style: undefined,
    letterAnimation: undefined,
    timing: undefined,
    position: undefined,
    reveal: undefined,
    containerStyle: undefined,
    effects: undefined,
    ...overrides,
  }
}
