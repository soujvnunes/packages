import './foundations.css'
import { STEPS } from './steps'
type StepName = keyof typeof STEPS
const STEP_NAMES = Object.keys(STEPS) as readonly StepName[]
interface StepLadderProps {
  names?: readonly StepName[]
}
export const StepLadder = ({ names = STEP_NAMES }: StepLadderProps) => (
  <div className="foundations-panel sb-unstyled">
    <ol className="foundations-ladder">
      {names.map((name) => (
        <li key={name} className="foundations-ladder-step">
          <span>{name}</span>
          <span className="foundations-ladder-value">{STEPS[name]}</span>
          <span
            aria-hidden="true"
            className="foundations-ladder-bar"
            style={{ inlineSize: `calc(var(--spacing) * ${STEPS[name]})` }}
          />
        </li>
      ))}
    </ol>
  </div>
)
