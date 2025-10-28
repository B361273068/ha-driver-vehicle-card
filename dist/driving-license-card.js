import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HassEntity } from 'home-assistant-js-websocket';
import { HomeAssistant } from 'custom-card-helpers';
import { formatDate, formatTime } from './utils';

interface PersonConfig {
  name: string;
  license_expiry_entity: string;
  license_status_entity: string;
  license_points_entity: string;
}

interface VehicleConfig {
  license_plate: string;
  inspection_date_entity: string;
  vehicle_status_entity: string;
  violations_entity: string;
}

interface DrivingVehicleCardConfig {
  title?: string;
  people: PersonConfig[];
  vehicles: VehicleConfig[];
  update_time_entity?: string;
}

@customElement('ha-driving-vehicle-card')
export class DrivingVehicleCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private config!: DrivingVehicleCardConfig;

  public static getStubConfig(): object {
    return {
      title: '驾驶证和车辆状态',
      people: [
        {
          name: '张三',
          license_expiry_entity: 'sensor.license_expiry_zhang',
          license_status_entity: 'binary_sensor.license_status_zhang',
          license_points_entity: 'sensor.license_points_zhang',
        },
      ],
      vehicles: [
        {
          license_plate: '京A12345',
          inspection_date_entity: 'sensor.inspection_date_vehicle1',
          vehicle_status_entity: 'binary_sensor.vehicle_status_vehicle1',
          violations_entity: 'sensor.violations_vehicle1',
        },
      ],
      update_time_entity: 'sensor.data_last_updated',
    };
  }

  public setConfig(config: DrivingVehicleCardConfig): void {
    if (!config.people || !config.vehicles) {
      throw new Error('请配置人员和车辆信息');
    }

    this.config = {
      title: '驾驶证和车辆状态',
      ...config,
    };
  }

  protected render() {
    if (!this.config || !this.hass) {
      return html``;
    }

    return html`
      <ha-card>
        <div class="card-header">
          <h2>${this.config.title}</h2>
        </div>
        <div class="card-content">
          ${this.config.people.map((person) => this.renderPersonSection(person))}
          ${this.config.vehicles.map((vehicle) => this.renderVehicleSection(vehicle))}
          ${this.renderUpdateTime()}
        </div>
      </ha-card>
    `;
  }

  private renderPersonSection(person: PersonConfig) {
    const expiryEntity = this.hass.states[person.license_expiry_entity];
    const statusEntity = this.hass.states[person.license_status_entity];
    const pointsEntity = this.hass.states[person.license_points_entity];

    const expiryDate = expiryEntity ? new Date(expiryEntity.state) : null;
    const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
    const status = statusEntity ? statusEntity.state : 'unknown';
    const points = pointsEntity ? pointsEntity.state : '0';

    return html`
      <div class="person-section">
        <div class="section-header">
          <ha-icon icon="mdi:card-account-details-outline"></ha-icon>
          <h3>${person.name} 的驾驶证信息</h3>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">有效期至</span>
            <span class="info-value">${expiryEntity ? formatDate(expiryEntity.state) : '未知'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">有效期倒计时</span>
            <span class="info-value ${daysLeft !== null && daysLeft < 30 ? 'text-warning' : ''}">
              ${daysLeft !== null ? `${daysLeft}天` : '未知'}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">驾驶证状态</span>
            <span class="info-value">
              <span class="status-badge ${status === 'on' ? 'status-normal' : 'status-warning'}">
                ${status === 'on' ? '正常' : status === 'off' ? '异常' : '未知'}
              </span>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">扣分情况</span>
            <span class="info-value">${points}/12分</span>
          </div>
        </div>
      </div>
    `;
  }

  private renderVehicleSection(vehicle: VehicleConfig) {
    const inspectionEntity = this.hass.states[vehicle.inspection_date_entity];
    const statusEntity = this.hass.states[vehicle.vehicle_status_entity];
    const violationsEntity = this.hass.states[vehicle.violations_entity];

    const inspectionDate = inspectionEntity ? new Date(inspectionEntity.state) : null;
    const daysLeft = inspectionDate ? Math.ceil((inspectionDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
    const status = statusEntity ? statusEntity.state : 'unknown';
    const violations = violationsEntity ? violationsEntity.state : '0';

    return html`
      <div class="vehicle-section">
        <div class="section-header">
          <ha-icon icon="mdi:car"></ha-icon>
          <h3>${vehicle.license_plate} 车辆信息</h3>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">年审日期</span>
            <span class="info-value">${inspectionEntity ? formatDate(inspectionEntity.state) : '未知'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">年审倒计时</span>
            <span class="info-value ${daysLeft !== null && daysLeft < 30 ? 'text-warning' : ''}">
              ${daysLeft !== null ? `${daysLeft}天` : '未知'}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">车辆状态</span>
            <span class="info-value">
              <span class="status-badge ${status === 'on' ? 'status-normal' : 'status-warning'}">
                ${status === 'on' ? '正常' : status === 'off' ? '异常' : '未知'}
              </span>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">违章信息</span>
            <span class="info-value ${violations !== '0' ? 'text-warning' : ''}">
              ${violations}条未处理
            </span>
          </div>
        </div>
      </div>
    `;
  }

  private renderUpdateTime() {
    if (!this.config.update_time_entity) {
      return html``;
    }

    const updateEntity = this.hass.states[this.config.update_time_entity];
    if (!updateEntity) {
      return html``;
    }

    return html`
      <div class="update-time">
        <span>最后更新: ${formatDate(updateEntity.state)} ${formatTime(updateEntity.state)}</span>
      </div>
    `;
  }

  static styles = css`
    .card-header {
      padding: 16px;
      border-bottom: 1px solid var(--divider-color);
    }
    
    .card-content {
      padding: 16px;
    }
    
    .person-section, .vehicle-section {
      margin-bottom: 24px;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      color: var(--primary-color);
    }
    
    .section-header ha-icon {
      margin-right: 8px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    
    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 8px;
      background-color: var(--secondary-background-color);
      border-radius: 4px;
    }
    
    .info-label {
      color: var(--secondary-text-color);
    }
    
    .info-value {
      font-weight: 500;
    }
    
    .status-badge {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.8em;
      font-weight: 500;
    }
    
    .status-normal {
      background-color: #4CAF50;
      color: white;
    }
    
    .status-warning {
      background-color: #FFC107;
      color: black;
    }
    
    .text-warning {
      color: #F57C00;
    }
    
    .update-time {
      margin-top: 16px;
      text-align: right;
      font-size: 0.8em;
      color: var(--secondary-text-color);
    }
  `;
}

// 注册卡片
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'ha-driving-vehicle-card',
  name: '驾驶证和车辆状态卡片',
  description: '显示驾驶证和车辆状态信息的卡片',
  preview: true,
});
