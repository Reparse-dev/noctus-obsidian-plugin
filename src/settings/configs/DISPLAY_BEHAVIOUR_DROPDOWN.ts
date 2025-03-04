import { DisplayBehaviour } from "src/enums";

export const DISPLAY_BEHAVIOUR_DROPDOWN: Record<DisplayBehaviour, string> = {
    [DisplayBehaviour.ALWAYS]: "Always visible",
    [DisplayBehaviour.TAG_TOUCHED]: "When touching the tag itself",
    [DisplayBehaviour.SYNTAX_TOUCHED]: "When touching its syntax"
}