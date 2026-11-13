import './foundations.css'
import { STEPS } from './steps'
const SCREEN_WIDTHS = [320, 1024] as const
const share = (pixels: number, width: number) => (pixels / width) * 100
export const ProportionChart = () => (
  <div className="foundations-panel sb-unstyled">
    <ul className="foundations-chart">
      {Object.entries(STEPS).map(([name, pixels]) => (
        <li key={name} className="foundations-chart-step">
          <span>
            {name}, {pixels}
          </span>
          {SCREEN_WIDTHS.map((width) => (
            <div key={width} className="foundations-chart-row">
              <span>{width}</span>
              <div className="foundations-chart-track">
                <span
                  aria-hidden="true"
                  className="foundations-chart-fill"
                  data-screen={width}
                  style={{ inlineSize: `${share(pixels, width)}%` }}
                />
              </div>
              <span>{share(pixels, width).toFixed(1)}%</span>
            </div>
          ))}
        </li>
      ))}
    </ul>
  </div>
)
