import './foundations.css'
import { ROLE_TONES } from './roles'
const ROLE_KEYS = Object.keys(ROLE_TONES) as readonly (keyof typeof ROLE_TONES)[]
const AMBIENTS = { light: 'Light', dim: 'Dim', dark: 'Dark', contrast: 'High contrast' } as const
const TEXT_STATES = { disabled: 'disabled', default: 'default', focused: 'focused' } as const
export const ColourMatrix = () => (
  <div
    aria-label="Colour roles on each ambient surface"
    className="foundations-panel foundations-scroll sb-unstyled"
    role="region"
    tabIndex={0}>
    <table className="foundations-matrix">
      <caption>
        Each chip is a role on a surface. The three dots are text in the disabled, default and focused
        state.
      </caption>
      <thead>
        <tr>
          <th scope="col">Surface</th>
          {ROLE_KEYS.map((role) => (
            <th key={role} scope="col">
              {role}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Object.entries(AMBIENTS).map(([ambient, label]) => (
          <tr key={ambient} data-ambient={ambient}>
            <th scope="row">{label}</th>
            {ROLE_KEYS.map((role) => (
              <td key={role}>
                <div className="foundations-chip" data-role={role} data-tone={ROLE_TONES[role]}>
                  {Object.entries(TEXT_STATES).map(([state, name]) => (
                    <span
                      key={state}
                      aria-label={`${role} on ${label.toLowerCase()}, ${name} text`}
                      className="foundations-dot"
                      data-state={state}
                      role="img"
                    />
                  ))}
                </div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)
