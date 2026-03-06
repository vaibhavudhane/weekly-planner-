import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService } from './services/app-state.service';
import type { BacklogEntry, TaskAssignment } from './services/app-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div [class]="s.theme() === 'dark' ? 'theme-dark' : 'theme-light'">
      <!-- NAVBAR -->
      @if (s.appSettings().setupComplete) {
        <nav class="navbar is-app" role="navigation">
          <div class="navbar-brand">
            <a class="navbar-item has-text-weight-bold is-size-5" (click)="s.goHome()"
              >📋 Weekly Plan Tracker</a
            >
          </div>
          <div class="navbar-end">
            @if (s.currentUserId()) {
              <div class="navbar-item">
                <span class="tag is-light mr-2">{{ s.currentUserName() }}</span>
                <span class="tag" [class]="s.isLead() ? 'is-warning' : 'is-info'">{{
                  s.isLead() ? 'Lead' : 'Member'
                }}</span>
              </div>
              <a class="navbar-item" (click)="s.view.set('identity')" title="Switch Person"
                >🔄 Switch</a
              >
            }
            @if (!['hub', 'identity', 'setup'].includes(s.view())) {
              <a class="navbar-item" (click)="s.goHome()" title="Home">🏠 Home</a>
            }
            <a class="navbar-item" (click)="s.toggleTheme()" title="Toggle theme">{{
              s.theme() === 'dark' ? '☀️ Light' : '🌙 Dark'
            }}</a>
          </div>
        </nav>
      }

      <main class="section">
        <div class="container" style="max-width:960px">
          <!-- TOAST -->
          @if (s.toast()) {
            <div
              class="notification is-app-success mb-4"
              style="position:fixed;top:70px;right:20px;z-index:100;max-width:350px;"
            >
              <button class="delete" (click)="s.toast.set('')"></button>
              {{ s.toast() }}
            </div>
          }

          <!-- ERROR -->
          @if (s.errorMsg()) {
            <div
              class="notification is-app-danger mb-4"
              style="position:fixed;top:70px;right:20px;z-index:100;max-width:400px;"
            >
              <button class="delete" (click)="s.errorMsg.set('')"></button>
              {{ s.errorMsg() }}
            </div>
          }

          <!-- VIEW: SETUP -->
          @if (s.view() === 'setup') {
            <div>
              <h1 class="title is-3">👋 Welcome! Let's set up your team.</h1>
              <p class="subtitle is-6">
                Add the people on your team. Pick one person as the Team Lead.
              </p>
              <div class="box mb-4">
                <div class="field has-addons">
                  <div class="control is-expanded">
                    <input
                      class="input"
                      type="text"
                      [ngModel]="s.setupName()"
                      (ngModelChange)="s.setupName.set($event)"
                      placeholder="Type a name here"
                      maxlength="100"
                      (keydown.enter)="s.addSetupMember()"
                    />
                  </div>
                  <div class="control">
                    <button class="button btn-primary" (click)="s.addSetupMember()">
                      Add This Person
                    </button>
                  </div>
                </div>
                @if (s.setupError()) {
                  <p class="help has-text-danger">{{ s.setupError() }}</p>
                }
              </div>
              @if (s.setupMembers().length === 0) {
                <div class="box"><p class="text-secondary">No team members added yet.</p></div>
              }
              @for (m of s.setupMembers(); track m.id) {
                <div class="box mb-2">
                  <div class="columns is-vcentered is-mobile">
                    <div class="column">
                      <strong>{{ m.name }}</strong>
                      @if (m.isLead) {
                        <span class="tag is-warning is-light ml-2">Team Lead</span>
                      }
                    </div>
                    <div class="column is-narrow">
                      @if (!m.isLead) {
                        <button
                          class="button is-small btn-secondary mr-1"
                          (click)="s.makeSetupLead(m.id)"
                        >
                          Make Lead
                        </button>
                      }
                      <button
                        class="button is-small btn-danger"
                        (click)="s.removeSetupMember(m.id)"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              }
              <button
                class="button btn-primary is-medium mt-4"
                [disabled]="s.setupMembers().length === 0 || !s.setupMembers().some(m => m.isLead)"
                (click)="s.finishSetup()"
              >
                Done — Go to Home Screen
              </button>
            </div>
          }

          <!-- VIEW: IDENTITY -->
          @if (s.view() === 'identity') {
            <div>
              <h1 class="title is-3">Who are you?</h1>
              <p class="subtitle is-6">Click your name to get started.</p>
              <div class="columns is-multiline">
                @for (m of s.activeMembers(); track m.id) {
                  <div class="column is-6-tablet is-4-desktop">
                    <div class="member-card" (click)="s.selectIdentity(m.id)">
                      <p class="is-size-5 has-text-weight-semibold">{{ m.name }}</p>
                      <span class="tag mt-2" [class]="m.isLead ? 'is-warning' : 'is-info'">{{
                        m.isLead ? 'Team Lead' : 'Team Member'
                      }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- VIEW: HUB -->
          @if (s.view() === 'hub') {
            <div>
              <h1 class="title is-3">What do you want to do?</h1>
              <p class="subtitle is-5">
                Hi, {{ s.currentUserName() }}!
                <span class="tag" [class]="s.isLead() ? 'is-warning' : 'is-info'">{{
                  s.isLead() ? 'Team Lead' : 'Team Member'
                }}</span>
              </p>
              @if (!s.activeCycle() && s.isLead()) {
                <div class="notification is-app-info mb-4">
                  No planning weeks yet. Click "Start a New Week" to begin!
                </div>
              }
              <div class="columns is-multiline">
                @if (s.isLead() && !s.activeCycle()) {
                  <div class="column is-6">
                    <div class="box action-card" (click)="s.startNewWeek()">
                      <p class="is-size-5 has-text-weight-bold">🚀 Start a New Week</p>
                      <p class="text-secondary">Set up a new planning cycle.</p>
                    </div>
                  </div>
                }
                @if (s.isLead() && s.activeCycle()?.state === 'SETUP') {
                  <div class="column is-6">
                    <div class="box action-card" (click)="s.view.set('cycleSetup')">
                      <p class="is-size-5 has-text-weight-bold">⚙️ Set Up This Week's Plan</p>
                      <p class="text-secondary">Pick members and set category percentages.</p>
                    </div>
                  </div>
                }
                @if (s.isLead() && s.activeCycle()?.state === 'PLANNING') {
                  <div class="column is-6">
                    <div class="box action-card" (click)="s.view.set('freezeReview')">
                      <p class="is-size-5 has-text-weight-bold">❄️ Review and Freeze the Plan</p>
                      <p class="text-secondary">Check everyone's hours and lock the plan.</p>
                    </div>
                  </div>
                }
                @if (s.isLead() && s.activeCycle()?.state === 'PLANNING' && s.isParticipating()) {
                  <div class="column is-6">
                    <div class="box action-card" (click)="s.view.set('planning')">
                      <p class="is-size-5 has-text-weight-bold">📝 Plan My Work</p>
                      <p class="text-secondary">Pick backlog items and commit hours.</p>
                    </div>
                  </div>
                }
                @if (s.isLead() && s.activeCycle()?.state === 'FROZEN') {
                  <div class="column is-6">
                    <div class="box action-card" (click)="s.viewDashboard()">
                      <p class="is-size-5 has-text-weight-bold">📊 See Team Progress</p>
                      <p class="text-secondary">Check how the team is doing.</p>
                    </div>
                  </div>
                }
                @if (s.isLead() && s.activeCycle()?.state === 'FROZEN' && s.isParticipating()) {
                  <div class="column is-6">
                    <div class="box action-card" (click)="s.view.set('progress')">
                      <p class="is-size-5 has-text-weight-bold">✏️ Update My Progress</p>
                      <p class="text-secondary">Report hours and status on your tasks.</p>
                    </div>
                  </div>
                }
                @if (s.isLead() && s.activeCycle()?.state === 'FROZEN') {
                  <div class="column is-6">
                    <div class="box action-card" (click)="s.confirmFinishWeek()">
                      <p class="is-size-5 has-text-weight-bold">✅ Finish This Week</p>
                      <p class="text-secondary">Close out this cycle.</p>
                    </div>
                  </div>
                }
                @if (!s.isLead() && s.activeCycle()?.state === 'PLANNING' && s.isParticipating()) {
                  <div class="column is-6">
                    <div class="box action-card" (click)="s.view.set('planning')">
                      <p class="is-size-5 has-text-weight-bold">📝 Plan My Work</p>
                      <p class="text-secondary">Pick backlog items and commit your 30 hours.</p>
                    </div>
                  </div>
                }
                @if (!s.isLead() && s.activeCycle()?.state === 'FROZEN' && s.isParticipating()) {
                  <div class="column is-6">
                    <div class="box action-card" (click)="s.view.set('progress')">
                      <p class="is-size-5 has-text-weight-bold">✏️ Update My Progress</p>
                      <p class="text-secondary">Report hours and status on your tasks.</p>
                    </div>
                  </div>
                }
                @if (!s.isLead() && s.activeCycle()?.state === 'FROZEN' && s.isParticipating()) {
                  <div class="column is-6">
                    <div class="box action-card" (click)="s.viewDashboard()">
                      <p class="is-size-5 has-text-weight-bold">📊 See Team Progress</p>
                      <p class="text-secondary">See how the team is doing overall.</p>
                    </div>
                  </div>
                }
                @if (!s.isLead() && (!s.activeCycle() || !s.isParticipating())) {
                  <div class="column is-12">
                    <div class="notification is-app-info">
                      There's no active plan for you right now. Check back on Tuesday or ask your
                      Team Lead.
                    </div>
                  </div>
                }
                <div class="column is-6">
                  <div class="box action-card" (click)="s.view.set('backlog')">
                    <p class="is-size-5 has-text-weight-bold">📋 Manage Backlog</p>
                    <p class="text-secondary">Add, edit, or browse work items.</p>
                  </div>
                </div>
                @if (s.isLead()) {
                  <div class="column is-6">
                    <div class="box action-card" (click)="s.view.set('team')">
                      <p class="is-size-5 has-text-weight-bold">👥 Manage Team Members</p>
                      <p class="text-secondary">Add or remove team members.</p>
                    </div>
                  </div>
                }
                <div class="column is-6">
                  <div class="box action-card" (click)="s.view.set('pastCycles')">
                    <p class="is-size-5 has-text-weight-bold">📅 View Past Weeks</p>
                    <p class="text-secondary">Look at completed planning cycles.</p>
                  </div>
                </div>
                @if (s.isLead() && s.activeCycle()?.state === 'PLANNING') {
                  <div class="column is-6">
                    <div
                      class="box action-card"
                      style="border-color:var(--danger)"
                      (click)="s.confirmCancelPlanning()"
                    >
                      <p class="is-size-5 has-text-weight-bold" style="color:var(--danger)">
                        🗑️ Cancel This Week's Planning
                      </p>
                      <p class="text-secondary">Erase all plans and start over.</p>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- VIEW: MANAGE TEAM -->
          @if (s.view() === 'team') {
            <div>
              <button class="button btn-secondary mb-4" (click)="s.goHome()">← Home</button>
              <h2 class="title is-4">Manage Team Members</h2>
              <div class="box mb-4">
                <div class="field has-addons">
                  <div class="control is-expanded">
                    <input
                      class="input"
                      type="text"
                      [ngModel]="s.newMemberName()"
                      (ngModelChange)="s.newMemberName.set($event)"
                      placeholder="Type a name"
                      maxlength="100"
                      (keydown.enter)="s.addTeamMember()"
                    />
                  </div>
                  <div class="control">
                    <button class="button btn-primary" (click)="s.addTeamMember()">
                      Save This Person
                    </button>
                  </div>
                </div>
                @if (s.teamError()) {
                  <p class="help has-text-danger">{{ s.teamError() }}</p>
                }
              </div>
              @for (m of s.teamMembers(); track m.id) {
                <div class="box mb-2" [style.opacity]="!m.isActive ? '0.6' : '1'">
                  <div class="columns is-vcentered is-mobile is-multiline">
                    <div class="column">
                      @if (s.editingMemberId() !== m.id) {
                        <span>
                          <strong>{{ m.name }}</strong>
                          @if (m.isLead) {
                            <span class="tag is-warning is-light ml-1">Lead</span>
                          }
                          @if (!m.isActive) {
                            <span class="tag is-light ml-1">Inactive</span>
                          }
                        </span>
                      }
                      @if (s.editingMemberId() === m.id) {
                        <div class="field has-addons">
                          <div class="control">
                            <input
                              class="input is-small"
                              [ngModel]="s.editingMemberVal()"
                              (ngModelChange)="s.editingMemberVal.set($event)"
                              maxlength="100"
                              (keydown.enter)="s.saveEditMember(m.id)"
                            />
                          </div>
                          <div class="control">
                            <button
                              class="button is-small btn-primary"
                              (click)="s.saveEditMember(m.id)"
                            >
                              Save
                            </button>
                          </div>
                          <div class="control">
                            <button
                              class="button is-small btn-secondary"
                              (click)="s.editingMemberId.set(null)"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      }
                    </div>
                    @if (s.editingMemberId() !== m.id) {
                      <div class="column is-narrow">
                        @if (m.isActive) {
                          <button
                            class="button is-small btn-secondary mr-1"
                            (click)="s.editingMemberId.set(m.id); s.editingMemberVal.set(m.name)"
                          >
                            Edit Name
                          </button>
                        }
                        @if (m.isActive && !m.isLead) {
                          <button
                            class="button is-small btn-secondary mr-1"
                            (click)="s.makeLead(m.id)"
                          >
                            Make Lead
                          </button>
                        }
                        @if (m.isActive && !m.isLead) {
                          <button
                            class="button is-small btn-danger mr-1"
                            (click)="s.deactivateMember(m.id)"
                          >
                            Deactivate
                          </button>
                        }
                        @if (!m.isActive) {
                          <button
                            class="button is-small btn-secondary"
                            (click)="s.reactivateMember(m.id)"
                          >
                            Reactivate
                          </button>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }

          <!-- VIEW: BACKLOG -->
          @if (s.view() === 'backlog') {
            <div>
              <button class="button btn-secondary mb-4" (click)="s.goHome()">← Home</button>
              <h2 class="title is-4">Manage Backlog</h2>
              <button
                class="button btn-primary mb-4"
                (click)="
                  s.editEntry.set(null);
                  s.backlogForm.set({
                    title: '',
                    description: '',
                    category: '',
                    estimatedEffort: '',
                  });
                  s.view.set('backlogEdit')
                "
              >
                Add a New Backlog Item
              </button>
              <div class="field is-grouped is-grouped-multiline mb-3">
                <div class="control">
                  <button
                    class="button is-small"
                    [class]="s.blFilter().client ? 'cat-badge-CLIENT_FOCUSED' : 'btn-secondary'"
                    (click)="toggleBlFilter('client')"
                  >
                    Client Focused
                  </button>
                </div>
                <div class="control">
                  <button
                    class="button is-small"
                    [class]="s.blFilter().tech ? 'cat-badge-TECH_DEBT' : 'btn-secondary'"
                    (click)="toggleBlFilter('tech')"
                  >
                    Tech Debt
                  </button>
                </div>
                <div class="control">
                  <button
                    class="button is-small"
                    [class]="s.blFilter().rd ? 'cat-badge-R_AND_D' : 'btn-secondary'"
                    (click)="toggleBlFilter('rd')"
                  >
                    R&D
                  </button>
                </div>
              </div>
              <div class="field is-grouped mb-3">
                <div class="control">
                  <div class="select is-small">
                    <select [ngModel]="s.blFilter().status" (ngModelChange)="setBlStatus($event)">
                      <option value="">Available Only</option>
                      <option value="ALL">Show All</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                </div>
                <div class="control is-expanded">
                  <input
                    class="input is-small"
                    type="text"
                    [ngModel]="s.blFilter().search"
                    (ngModelChange)="setBlSearch($event)"
                    placeholder="Search by title"
                  />
                </div>
              </div>
              @for (e of s.filteredBacklog(); track e.id) {
                <div class="box mb-2">
                  <div class="columns is-vcentered is-mobile is-multiline">
                    <div class="column">
                      <strong>{{ e.title }}</strong>
                      <span class="tag is-cat ml-1" [class]="'cat-badge-' + e.category">{{
                        s.catLabel(e.category)
                      }}</span>
                      <span class="tag is-light ml-1">{{ e.status }}</span>
                      @if (e.estimatedEffort) {
                        <span class="text-secondary is-size-7 ml-1"
                          >{{ e.estimatedEffort }}h est.</span
                        >
                      }
                    </div>
                    <div class="column is-narrow">
                      <button
                        class="button is-small btn-secondary mr-1"
                        (click)="s.startEditEntry(e)"
                      >
                        View & Edit
                      </button>
                      @if (s.isLead() && (e.status === 'AVAILABLE' || e.status === 'COMPLETED')) {
                        <button
                          class="button is-small btn-danger mr-1"
                          (click)="s.archiveEntry(e.id)"
                        >
                          Archive
                        </button>
                        <button class="button is-small btn-danger" (click)="deleteEntry(e.id)">
                          Delete
                        </button>
                      }
                    </div>
                  </div>
                </div>
              }
              @if (s.filteredBacklog().length === 0) {
                <div class="notification is-app-info">No backlog items match your filters.</div>
              }
            </div>
          }

          <!-- VIEW: BACKLOG EDIT -->
          @if (s.view() === 'backlogEdit') {
            <div>
              <button class="button btn-secondary mb-4" (click)="s.view.set('backlog')">
                ← Go Back
              </button>
              <h2 class="title is-4">
                {{ s.editEntry() ? 'Edit Backlog Item' : 'Add a New Backlog Item' }}
              </h2>
              <div class="box">
                <div class="field">
                  <label class="label">Title</label>
                  <div class="control">
                    <input
                      class="input"
                      type="text"
                      [ngModel]="s.backlogForm().title"
                      (ngModelChange)="setBacklogField('title', $event)"
                      placeholder="What is this work about?"
                      maxlength="200"
                    />
                  </div>
                </div>
                <div class="field">
                  <label class="label">Description</label>
                  <div class="control">
                    <textarea
                      class="textarea"
                      [ngModel]="s.backlogForm().description"
                      (ngModelChange)="setBacklogField('description', $event)"
                      placeholder="Add more details here (optional)"
                      maxlength="5000"
                    ></textarea>
                  </div>
                </div>
                <div class="field">
                  <label class="label">Category</label>
                  <div class="control">
                    <div class="select">
                      <select
                        [ngModel]="s.backlogForm().category"
                        (ngModelChange)="setBacklogField('category', $event)"
                        [disabled]="!!s.editEntry()"
                      >
                        <option value="">Pick a category</option>
                        <option value="CLIENT_FOCUSED">Client Focused</option>
                        <option value="TECH_DEBT">Tech Debt</option>
                        <option value="R_AND_D">R&D</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div class="field">
                  <label class="label">Estimated hours (optional)</label>
                  <div class="control">
                    <input
                      class="input"
                      type="number"
                      [ngModel]="s.backlogForm().estimatedEffort"
                      (ngModelChange)="setBacklogField('estimatedEffort', $event)"
                      placeholder="How many hours might this take?"
                      min="0"
                      max="999.5"
                      step="0.5"
                    />
                  </div>
                </div>
                @if (s.backlogError()) {
                  <p class="help has-text-danger mb-2">{{ s.backlogError() }}</p>
                }
                <div class="field is-grouped">
                  <div class="control">
                    <button class="button btn-primary" (click)="s.saveBacklogEntry()">
                      Save This Item
                    </button>
                  </div>
                  <div class="control">
                    <button class="button btn-secondary" (click)="s.view.set('backlog')">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- VIEW: CYCLE SETUP -->
          @if (s.view() === 'cycleSetup') {
            <div>
              <button class="button btn-secondary mb-4" (click)="s.goHome()">← Home</button>
              <h2 class="title is-4">Set Up This Week's Plan</h2>
              <div class="box mb-4">
                <div class="field">
                  <label class="label">Planning date (pick a Tuesday)</label>
                  <div class="control">
                    <input
                      class="input"
                      type="date"
                      [ngModel]="s.cycleForm().planningDate"
                      (ngModelChange)="setCycleField('planningDate', $event)"
                    />
                  </div>
                  @if (s.cycleForm().planningDate && !s.isTuesday(s.cycleForm().planningDate)) {
                    <p class="help has-text-danger">
                      {{ s.cycleForm().planningDate }} is not a Tuesday. Please pick a Tuesday.
                    </p>
                  }
                  @if (s.cycleForm().planningDate && s.isTuesday(s.cycleForm().planningDate)) {
                    <p class="help">
                      Work period: {{ s.addDays(s.cycleForm().planningDate, 1) }} to
                      {{ s.addDays(s.cycleForm().planningDate, 6) }}
                    </p>
                  }
                </div>
              </div>
              <div class="box mb-4">
                <label class="label">Who is working this week?</label>
                @for (m of s.activeMembers(); track m.id) {
                  <label
                    class="checkbox is-block mb-2"
                    style="display:flex;align-items:center;gap:8px"
                  >
                    <input
                      type="checkbox"
                      [value]="m.id"
                      [checked]="s.cycleForm().memberIds.includes(m.id)"
                      (change)="toggleCycleMember(m.id, $event)"
                    />
                    <span>{{ m.name }}</span>
                    @if (m.isLead) {
                      <span class="tag is-warning is-light">Lead</span>
                    }
                  </label>
                }
                <p class="mt-2 text-secondary">
                  Team members selected: <strong>{{ s.cycleForm().memberIds.length }}</strong
                  >. Total hours to plan: <strong>{{ s.cycleForm().memberIds.length * 30 }}</strong>
                </p>
              </div>
              <div class="box mb-4">
                <label class="label">How should the hours be split?</label>
                <div class="columns">
                  <div class="column">
                    <div class="field">
                      <label class="label is-small">Client Focused %</label>
                      <div class="control">
                        <input
                          class="input"
                          type="number"
                          [ngModel]="s.cycleForm().pctClient"
                          (ngModelChange)="setCycleField('pctClient', $event)"
                          min="0"
                          max="100"
                          step="1"
                        />
                      </div>
                    </div>
                  </div>
                  <div class="column">
                    <div class="field">
                      <label class="label is-small">Tech Debt %</label>
                      <div class="control">
                        <input
                          class="input"
                          type="number"
                          [ngModel]="s.cycleForm().pctTech"
                          (ngModelChange)="setCycleField('pctTech', $event)"
                          min="0"
                          max="100"
                          step="1"
                        />
                      </div>
                    </div>
                  </div>
                  <div class="column">
                    <div class="field">
                      <label class="label is-small">R&D %</label>
                      <div class="control">
                        <input
                          class="input"
                          type="number"
                          [ngModel]="s.cycleForm().pctRD"
                          (ngModelChange)="setCycleField('pctRD', $event)"
                          min="0"
                          max="100"
                          step="1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <p
                  [class]="s.pctSum() === 100 ? 'has-text-success' : 'has-text-danger'"
                  class="has-text-weight-bold"
                >
                  Total: {{ s.pctSum() }}%
                  @if (s.pctSum() !== 100) {
                    <span>(must be 100%)</span>
                  }
                  @if (s.pctSum() === 100) {
                    <span>✓</span>
                  }
                </p>
                @if (s.pctSum() === 100 && s.cycleForm().memberIds.length > 0) {
                  <div class="columns mt-2">
                    <div class="column has-text-centered">
                      <span class="tag cat-badge-CLIENT_FOCUSED">Client</span><br /><strong
                        >{{ s.calcBudget('CLIENT_FOCUSED') }}h</strong
                      >
                    </div>
                    <div class="column has-text-centered">
                      <span class="tag cat-badge-TECH_DEBT">Tech Debt</span><br /><strong
                        >{{ s.calcBudget('TECH_DEBT') }}h</strong
                      >
                    </div>
                    <div class="column has-text-centered">
                      <span class="tag cat-badge-R_AND_D">R&D</span><br /><strong
                        >{{ s.calcBudget('R_AND_D') }}h</strong
                      >
                    </div>
                  </div>
                }
              </div>
              @if (s.cycleError()) {
                <p class="help has-text-danger mb-2">{{ s.cycleError() }}</p>
              }
              <button
                class="button btn-primary is-medium"
                (click)="s.openPlanning()"
                [disabled]="
                  s.cycleForm().memberIds.length === 0 ||
                  s.pctSum() !== 100 ||
                  !s.isTuesday(s.cycleForm().planningDate)
                "
              >
                Open Planning for the Team
              </button>
            </div>
          }

          <!-- VIEW: PLANNING -->
          @if (s.view() === 'planning') {
            <div>
              <button class="button btn-secondary mb-4" (click)="s.goHome()">← Home</button>
              <h2 class="title is-4">Plan My Work</h2>
              <div class="notification is-app-info">
                Your hours: <strong>{{ s.myPlannedHours() }}</strong> of 30 planned.
                <strong>{{ 30 - s.myPlannedHours() }}</strong> hours left.
                @if (s.myPlan()?.isReady) {
                  <span class="tag is-success ml-2">✓ You marked yourself as ready</span>
                }
              </div>
              <div class="columns mb-4">
                @for (cat of ['CLIENT_FOCUSED', 'TECH_DEBT', 'R_AND_D']; track cat) {
                  <div class="column">
                    <div class="box">
                      <span class="tag is-cat mb-1" [class]="'cat-badge-' + cat">{{
                        s.catLabel(cat)
                      }}</span>
                      <p class="is-size-7">
                        Budget: <strong>{{ s.getCatBudget(cat) }}h</strong>
                      </p>
                      <p class="is-size-7">
                        Claimed: <strong>{{ s.getCatClaimed(cat) }}h</strong>
                      </p>
                      <p class="is-size-7">
                        Left: <strong>{{ s.getCatBudget(cat) - s.getCatClaimed(cat) }}h</strong>
                      </p>
                      <div class="progress-bar-outer mt-1">
                        <div
                          class="progress-bar-inner is-ok"
                          [style.width]="pct(s.getCatClaimed(cat), s.getCatBudget(cat)) + '%'"
                        ></div>
                      </div>
                    </div>
                  </div>
                }
              </div>
              <button
                class="button btn-primary mb-4"
                (click)="s.view.set('claim')"
                [disabled]="s.myPlannedHours() >= 30"
              >
                Add Work from Backlog
              </button>
              <button class="button btn-secondary mb-4 ml-2" (click)="s.toggleReady()">
                {{ s.myPlan()?.isReady ? "Undo — I'm Not Done Yet" : "I'm Done Planning" }}
              </button>
              <h3 class="title is-5">My Plan</h3>
              @if (s.myAssignments().length === 0) {
                <div class="notification is-app-info">
                  You haven't picked any work yet. Click "Add Work from Backlog" to get started.
                </div>
              }
              @for (ta of s.myAssignments(); track ta.id) {
                <div class="box mb-2">
                  <div class="columns is-vcentered is-mobile is-multiline">
                    <div class="column">
                      <strong>{{ s.getEntry(ta.backlogEntryId)?.title }}</strong>
                      <span
                        class="tag is-cat ml-1"
                        [class]="'cat-badge-' + s.getEntry(ta.backlogEntryId)?.category"
                        >{{ s.catLabel(s.getEntry(ta.backlogEntryId)?.category ?? '') }}</span
                      >
                      <span class="ml-2">{{ ta.committedHours }}h</span>
                    </div>
                    <div class="column is-narrow">
                      @if (s.editingAssignId() !== ta.id) {
                        <button
                          class="button is-small btn-secondary mr-1"
                          (click)="
                            s.editingAssignId.set(ta.id); s.editingAssignHrs.set(ta.committedHours)
                          "
                        >
                          Change Hours
                        </button>
                        <button
                          class="button is-small btn-danger"
                          (click)="s.removeAssignment(ta.id)"
                        >
                          Remove
                        </button>
                      }
                      @if (s.editingAssignId() === ta.id) {
                        <div class="field has-addons">
                          <div class="control">
                            <input
                              class="input is-small"
                              type="number"
                              [ngModel]="s.editingAssignHrs()"
                              (ngModelChange)="s.editingAssignHrs.set($event)"
                              step="0.5"
                              min="0.5"
                              max="30"
                              style="width:80px"
                            />
                          </div>
                          <div class="control">
                            <button
                              class="button is-small btn-primary"
                              (click)="s.saveAssignHours(ta.id)"
                            >
                              Save
                            </button>
                          </div>
                          <div class="control">
                            <button
                              class="button is-small btn-secondary"
                              (click)="s.editingAssignId.set(null)"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                  @if (s.assignError() && s.editingAssignId() === ta.id) {
                    <p class="help has-text-danger">{{ s.assignError() }}</p>
                  }
                </div>
              }
            </div>
          }

          <!-- VIEW: CLAIM -->
          @if (s.view() === 'claim') {
            <div>
              <button class="button btn-secondary mb-4" (click)="s.view.set('planning')">
                ← Go Back
              </button>
              <h2 class="title is-4">Pick a Backlog Item</h2>
              <p class="mb-3">
                You have <strong>{{ 30 - s.myPlannedHours() }}</strong> hours left to plan.
              </p>
              <div class="field is-grouped mb-3">
                @for (cat of ['CLIENT_FOCUSED', 'TECH_DEBT', 'R_AND_D']; track cat) {
                  <div class="control">
                    <button
                      class="button is-small"
                      [class]="s.claimCatFilter()[cat] ? 'cat-badge-' + cat : 'btn-secondary'"
                      (click)="toggleClaimCat(cat)"
                    >
                      {{ s.catLabel(cat) }} ({{ s.getCatBudget(cat) - s.getCatClaimed(cat) }}h left)
                    </button>
                  </div>
                }
              </div>
              @for (e of s.claimableEntries(); track e.id) {
                <div class="box mb-2">
                  <div class="columns is-vcentered is-multiline">
                    <div class="column">
                      <strong>{{ e.title }}</strong>
                      <span class="tag is-cat ml-1" [class]="'cat-badge-' + e.category">{{
                        s.catLabel(e.category)
                      }}</span>
                      @if (e.estimatedEffort) {
                        <span class="text-secondary is-size-7 ml-1"
                          >{{ e.estimatedEffort }}h est.</span
                        >
                      }
                      @if (e.status === 'IN_PLAN') {
                        <span class="tag is-light ml-1">(Someone picked this)</span>
                      }
                      @if (e.description) {
                        <p class="text-secondary is-size-7 mt-1">
                          {{ e.description.substring(0, 100)
                          }}{{ e.description.length > 100 ? '...' : '' }}
                        </p>
                      }
                    </div>
                    <div class="column is-narrow">
                      <button class="button is-small btn-primary" (click)="s.startClaim(e)">
                        Pick This Item
                      </button>
                    </div>
                  </div>
                </div>
              }
              @if (s.claimableEntries().length === 0) {
                <div class="notification is-app-info">
                  No backlog items are available in the categories you selected.
                </div>
              }
              <!-- Claim Modal -->
              <div class="modal" [class.is-active]="s.claimModal()">
                <div class="modal-background" (click)="s.claimModal.set(false)"></div>
                <div class="modal-card">
                  <header class="modal-card-head">
                    <p class="modal-card-title">How many hours will you work on this?</p>
                    <button class="delete" (click)="s.claimModal.set(false)"></button>
                  </header>
                  <section
                    class="modal-card-body"
                    style="background:var(--bg-surface);color:var(--text-primary)"
                  >
                    <p class="mb-2">
                      <strong>{{ s.claimEntry()?.title }}</strong>
                      <span
                        class="tag is-cat"
                        [class]="'cat-badge-' + (s.claimEntry()?.category || '')"
                        >{{ s.catLabel(s.claimEntry()?.category ?? '') }}</span
                      >
                    </p>
                    <p class="mb-1">
                      Your hours left: <strong>{{ 30 - s.myPlannedHours() }}</strong>
                    </p>
                    <p class="mb-3">
                      {{ s.catLabel(s.claimEntry()?.category ?? '') }} budget left:
                      {{
                        s.getCatBudget(s.claimEntry()?.category ?? '') -
                          s.getCatClaimed(s.claimEntry()?.category ?? '')
                      }}h
                    </p>
                    @if (s.claimEntry()?.estimatedEffort) {
                      <p class="mb-2 text-secondary">
                        Estimate for this item: {{ s.claimEntry()?.estimatedEffort }}h. You can
                        enter any amount.
                      </p>
                    }
                    <div class="field">
                      <label class="label">Hours to commit</label>
                      <div class="control">
                        <input
                          class="input"
                          type="number"
                          [ngModel]="s.claimHours()"
                          (ngModelChange)="s.claimHours.set($event)"
                          step="0.5"
                          min="0.5"
                          placeholder="Enter hours (like 2 or 3.5)"
                        />
                      </div>
                    </div>
                    @if (s.claimError()) {
                      <p class="help has-text-danger">{{ s.claimError() }}</p>
                    }
                  </section>
                  <footer class="modal-card-foot">
                    <button class="button btn-primary" (click)="s.submitClaim()">
                      Add to My Plan
                    </button>
                    <button class="button btn-secondary" (click)="s.claimModal.set(false)">
                      Cancel
                    </button>
                  </footer>
                </div>
              </div>
            </div>
          }

          <!-- VIEW: FREEZE REVIEW -->
          @if (s.view() === 'freezeReview') {
            <div>
              <button class="button btn-secondary mb-4" (click)="s.goHome()">← Home</button>
              <h2 class="title is-4">Review the Team's Plan</h2>
              <p class="text-secondary mb-4">
                Week of {{ s.activeCycle()?.planningDate }}.
                {{ s.activeCycle()?.participatingMemberIds?.length }} team members.
                {{ (s.activeCycle()?.participatingMemberIds?.length ?? 0) * 30 }} total hours.
              </p>
              <h3 class="title is-5">Category Summary</h3>
              <table class="table is-fullwidth is-hoverable mb-4">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Budget</th>
                    <th>Planned</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (cat of ['CLIENT_FOCUSED', 'TECH_DEBT', 'R_AND_D']; track cat) {
                    <tr>
                      <td>
                        <span class="tag is-cat" [class]="'cat-badge-' + cat">{{
                          s.catLabel(cat)
                        }}</span>
                      </td>
                      <td>{{ s.getCatBudget(cat) }}h</td>
                      <td>{{ s.getCatClaimed(cat) }}h</td>
                      <td>
                        <span
                          [class]="
                            s.getCatClaimed(cat) === s.getCatBudget(cat)
                              ? 'has-text-success'
                              : 'has-text-danger'
                          "
                          >{{
                            s.getCatClaimed(cat) === s.getCatBudget(cat)
                              ? '✓ Match'
                              : '⚠ Off by ' + (s.getCatBudget(cat) - s.getCatClaimed(cat)) + 'h'
                          }}</span
                        >
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
              <h3 class="title is-5">Member Summary</h3>
              @for (mid of s.activeCycle()?.participatingMemberIds ?? []; track mid) {
                <div class="box mb-2" style="cursor:pointer" (click)="toggleFreezeDetail(mid)">
                  <div class="columns is-vcentered is-mobile">
                    <div class="column">
                      <strong>{{ s.getMember(mid)?.name }}</strong>
                    </div>
                    <div class="column">
                      <span
                        [class]="
                          s.getMemberPlanned(mid) === 30 ? 'has-text-success' : 'has-text-danger'
                        "
                        >{{ s.getMemberPlanned(mid) }} / 30h</span
                      >
                    </div>
                    <div class="column is-narrow">
                      <span
                        class="tag"
                        [class]="s.getMemberPlan(mid)?.isReady ? 'is-success' : 'is-light'"
                        >{{ s.getMemberPlan(mid)?.isReady ? '✓ Ready' : 'Not yet' }}</span
                      >
                    </div>
                  </div>
                  @if (s.freezeDetailMember() === mid) {
                    <div class="mt-2">
                      <table class="table is-fullwidth is-size-7">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Category</th>
                            <th>Hours</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (ta of s.getMemberAssignments(mid); track ta.id) {
                            <tr>
                              <td>{{ s.getEntry(ta.backlogEntryId)?.title }}</td>
                              <td>
                                <span
                                  class="tag is-cat is-small"
                                  [class]="'cat-badge-' + s.getEntry(ta.backlogEntryId)?.category"
                                  >{{
                                    s.catLabel(s.getEntry(ta.backlogEntryId)?.category ?? '')
                                  }}</span
                                >
                              </td>
                              <td>{{ ta.committedHours }}h</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  }
                </div>
              }
              @if (s.freezeErrors().length === 0) {
                <div class="notification is-app-success mt-4">
                  Everything looks good! You can freeze the plan.
                </div>
              }
              @if (s.freezeErrors().length > 0) {
                <div class="notification is-app-danger mt-4">
                  <p class="has-text-weight-bold mb-1">Can't freeze yet:</p>
                  @for (err of s.freezeErrors(); track err) {
                    <p>• {{ err }}</p>
                  }
                </div>
              }
              <div class="mt-4">
                <button
                  class="button btn-primary is-medium"
                  [disabled]="s.freezeErrors().length > 0"
                  (click)="s.confirmFreeze()"
                >
                  ❄️ Freeze the Plan
                </button>
                <button class="button btn-danger is-small ml-3" (click)="s.confirmCancelPlanning()">
                  Cancel Planning
                </button>
              </div>
            </div>
          }

          <!-- VIEW: PROGRESS -->
          @if (s.view() === 'progress') {
            <div>
              <button class="button btn-secondary mb-4" (click)="s.goHome()">← Home</button>
              <h2 class="title is-4">Update My Progress</h2>
              <p class="text-secondary mb-2">
                Week of {{ s.frozenCycle()?.planningDate }}. Your plan: 30 hours.
              </p>
              <div class="notification is-app-info mb-4">
                You've completed <strong>{{ s.myCompletedHours() }}</strong> of 30 hours (<strong
                  >{{ pct(s.myCompletedHours(), 30) }}%</strong
                >)
                <div class="progress-bar-outer mt-2">
                  <div
                    class="progress-bar-inner is-ok"
                    [style.width]="pct(s.myCompletedHours(), 30) + '%'"
                  ></div>
                </div>
              </div>
              @for (ta of s.myFrozenAssignments(); track ta.id) {
                <div class="box mb-2" [class.overage]="ta.hoursCompleted > ta.committedHours">
                  <div class="columns is-vcentered is-multiline">
                    <div class="column">
                      <strong>{{ s.getEntry(ta.backlogEntryId)?.title }}</strong>
                      <span
                        class="tag is-cat ml-1"
                        [class]="'cat-badge-' + s.getEntry(ta.backlogEntryId)?.category"
                        >{{ s.catLabel(s.getEntry(ta.backlogEntryId)?.category ?? '') }}</span
                      >
                      <span class="tag ml-1" [class]="'stat-badge-' + ta.progressStatus">{{
                        s.statusLabel(ta.progressStatus)
                      }}</span>
                    </div>
                    <div class="column">
                      <span>{{ ta.hoursCompleted }} of {{ ta.committedHours }}h done</span>
                      @if (ta.hoursCompleted > ta.committedHours) {
                        <span class="has-text-warning">
                          (over by {{ ta.hoursCompleted - ta.committedHours }}h)</span
                        >
                      }
                      <div class="progress-bar-outer mt-1">
                        <div
                          class="progress-bar-inner"
                          [class]="ta.hoursCompleted > ta.committedHours ? 'is-over' : 'is-ok'"
                          [style.width]="pct(ta.hoursCompleted, ta.committedHours) + '%'"
                        ></div>
                      </div>
                    </div>
                    <div class="column is-narrow">
                      <button
                        class="button is-small btn-primary"
                        (click)="s.startProgressUpdate(ta)"
                      >
                        Update This Task
                      </button>
                    </div>
                  </div>
                </div>
              }
              <!-- Progress Modal -->
              <div class="modal" [class.is-active]="s.progressModal()">
                <div class="modal-background" (click)="s.progressModal.set(false)"></div>
                <div class="modal-card">
                  <header class="modal-card-head">
                    <p class="modal-card-title">
                      Update: {{ s.getEntry(s.progressTA()?.backlogEntryId ?? '')?.title }}
                    </p>
                    <button class="delete" (click)="s.progressModal.set(false)"></button>
                  </header>
                  <section
                    class="modal-card-body"
                    style="background:var(--bg-surface);color:var(--text-primary)"
                  >
                    <p class="mb-3">
                      Committed: <strong>{{ s.progressTA()?.committedHours }}h</strong>. Currently:
                      <strong>{{ s.progressTA()?.hoursCompleted }}h</strong> done.
                    </p>
                    <div class="field">
                      <label class="label">Hours completed</label>
                      <div class="control">
                        <input
                          class="input"
                          type="number"
                          [ngModel]="s.progForm().hours"
                          (ngModelChange)="setProgField('hours', $event)"
                          step="0.5"
                          min="0"
                        />
                      </div>
                    </div>
                    <div class="field">
                      <label class="label">Status</label>
                      <div class="control">
                        <div class="select">
                          <select
                            [ngModel]="s.progForm().status"
                            (ngModelChange)="setProgField('status', $event)"
                          >
                            @for (opt of s.allowedStatuses(); track opt) {
                              <option [value]="opt">{{ s.statusLabel(opt) }}</option>
                            }
                          </select>
                        </div>
                      </div>
                    </div>
                    <div class="field">
                      <label class="label">Note (optional)</label>
                      <div class="control">
                        <textarea
                          class="textarea"
                          [ngModel]="s.progForm().note"
                          (ngModelChange)="setProgField('note', $event)"
                          placeholder="Add a note about this task"
                          maxlength="1000"
                        ></textarea>
                      </div>
                    </div>
                    @if (s.progForm().hours > (s.progressTA()?.committedHours ?? 0)) {
                      <p class="help has-text-warning">
                        You've put in more hours than you planned. That's okay — this will be noted.
                      </p>
                    }
                    @if (s.progError()) {
                      <p class="help has-text-danger">{{ s.progError() }}</p>
                    }
                  </section>
                  <footer class="modal-card-foot">
                    <button class="button btn-primary" (click)="s.submitProgress()">
                      Save Progress
                    </button>
                    <button class="button btn-secondary" (click)="s.progressModal.set(false)">
                      Cancel
                    </button>
                  </footer>
                </div>
              </div>
            </div>
          }

          <!-- VIEW: DASHBOARD -->
          @if (s.view() === 'dashboard') {
            <div>
              <button
                class="button btn-secondary mb-4"
                (click)="
                  s.dashCycleId() === s.activeCycle()?.id ? s.goHome() : s.view.set('pastCycles')
                "
              >
                ← {{ s.dashCycleId() === s.activeCycle()?.id ? 'Home' : 'Back' }}
              </button>
              <h2 class="title is-4">
                {{
                  (s.dashCycle()?.state === 'COMPLETED' ? 'Past Week — ' : 'Team Progress — ') +
                    s.dashCycle()?.planningDate
                }}
              </h2>
              <span
                class="tag mb-4"
                [class]="s.dashCycle()?.state === 'FROZEN' ? 'is-info' : 'is-success'"
                >{{ s.dashCycle()?.state }}</span
              >
              <div class="columns mb-4">
                <div class="column">
                  <div class="box has-text-centered">
                    <p class="is-size-7 text-secondary">Overall Progress</p>
                    <p class="is-size-4 has-text-weight-bold">
                      {{ s.dashTotalCompleted() }}h / {{ s.dashCapacity() }}h
                    </p>
                    <p>{{ pct(s.dashTotalCompleted(), s.dashCapacity()) }}%</p>
                    <div class="progress-bar-outer mt-1">
                      <div
                        class="progress-bar-inner is-ok"
                        [style.width]="pct(s.dashTotalCompleted(), s.dashCapacity()) + '%'"
                      ></div>
                    </div>
                  </div>
                </div>
                <div class="column">
                  <div class="box has-text-centered">
                    <p class="is-size-7 text-secondary">Tasks Done</p>
                    <p class="is-size-4 has-text-weight-bold">
                      {{ s.dashCompletedTasks() }} / {{ s.dashAllAssignments().length }}
                    </p>
                  </div>
                </div>
                <div class="column">
                  <div
                    class="box has-text-centered"
                    [style.border-color]="s.dashBlockedTasks() > 0 ? 'var(--danger)' : ''"
                  >
                    <p class="is-size-7 text-secondary">Blocked</p>
                    <p
                      class="is-size-4 has-text-weight-bold"
                      [style.color]="s.dashBlockedTasks() > 0 ? 'var(--danger)' : ''"
                    >
                      {{ s.dashBlockedTasks() }}
                    </p>
                  </div>
                </div>
              </div>
              @if (s.dashAllAssignments().every(t=>t.progressStatus==='COMPLETED')) {
                <div class="notification is-app-success mb-4">
                  🎉 Great work! All tasks are done this week!
                </div>
              }
              @if (
                s.dashAllAssignments().every(t=>t.hoursCompleted===0)&&s.dashCycle()?.state==='FROZEN'
              ) {
                <div class="notification is-app-info mb-4">No one has reported progress yet.</div>
              }
              <h3 class="title is-5">By Category</h3>
              @for (cat of ['CLIENT_FOCUSED', 'TECH_DEBT', 'R_AND_D']; track cat) {
                <div
                  class="box mb-3 action-card"
                  (click)="s.drillCat.set(cat); s.view.set('catDrill')"
                >
                  <div class="columns is-vcentered">
                    <div class="column">
                      <span class="tag is-cat" [class]="'cat-badge-' + cat">{{
                        s.catLabel(cat)
                      }}</span>
                    </div>
                    <div class="column">
                      <span>Budget: {{ s.getDashCatBudget(cat) }}h</span>
                    </div>
                    <div class="column">
                      <span
                        >Done: {{ s.dashCatCompleted(cat) }}h ({{
                          pct(s.dashCatCompleted(cat), s.getDashCatBudget(cat))
                        }}%)</span
                      >
                    </div>
                    <div class="column is-narrow">
                      <button class="button is-small btn-secondary">See Details →</button>
                    </div>
                  </div>
                  <div class="progress-bar-outer mt-1">
                    <div
                      class="progress-bar-inner is-ok"
                      [style.width]="pct(s.dashCatCompleted(cat), s.getDashCatBudget(cat)) + '%'"
                    ></div>
                  </div>
                </div>
              }
              @if (s.isLead()) {
                <h3 class="title is-5 mt-5">By Member</h3>
                @for (mid of s.dashCycle()?.participatingMemberIds ?? []; track mid) {
                  <div
                    class="box mb-2 action-card"
                    (click)="s.drillMember.set(mid); s.view.set('memberDrill')"
                  >
                    <div class="columns is-vcentered is-mobile">
                      <div class="column">
                        <strong>{{ s.getMember(mid)?.name }}</strong>
                      </div>
                      <div class="column">
                        <span
                          >{{ s.dashMemberCompleted(mid) }}h / 30h ({{
                            pct(s.dashMemberCompleted(mid), 30)
                          }}%)</span
                        >
                      </div>
                      <div class="column is-narrow">
                        <span
                          class="tag"
                          [class]="
                            s.dashMemberBlocked(mid)
                              ? 'is-danger'
                              : s.dashMemberAllDone(mid)
                                ? 'is-success'
                                : 'is-info'
                          "
                          >{{
                            s.dashMemberBlocked(mid)
                              ? 'Blocked'
                              : s.dashMemberAllDone(mid)
                                ? 'All Done'
                                : 'Working'
                          }}</span
                        >
                        <button class="button is-small btn-secondary ml-2">See Plan →</button>
                      </div>
                    </div>
                  </div>
                }
              }
              @if (!s.isLead()) {
                <div class="notification is-app-info mt-4">
                  Team completion:
                  <strong>{{ pct(s.dashTotalCompleted(), s.dashCapacity()) }}%</strong>
                </div>
              }
            </div>
          }

          <!-- VIEW: CAT DRILL -->
          @if (s.view() === 'catDrill') {
            <div>
              <button class="button btn-secondary mb-4" (click)="s.view.set('dashboard')">
                ← Go Back
              </button>
              <h2 class="title is-4">
                <span class="tag is-cat" [class]="'cat-badge-' + s.drillCat()">{{
                  s.catLabel(s.drillCat() ?? '')
                }}</span>
                — Details
              </h2>
              <p class="mb-3">
                Budget: {{ s.getDashCatBudget(s.drillCat() ?? '') }}h. Completed:
                {{ s.dashCatCompleted(s.drillCat() ?? '') }}h ({{
                  pct(
                    s.dashCatCompleted(s.drillCat() ?? ''),
                    s.getDashCatBudget(s.drillCat() ?? '')
                  )
                }}%)
              </p>
              <table class="table is-fullwidth is-hoverable">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>{{ s.isLead() ? 'Assigned To' : 'Member' }}</th>
                    <th>Committed</th>
                    <th>Done</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (ta of s.dashCatAssignments(s.drillCat() ?? ''); track ta.id) {
                    <tr
                      style="cursor:pointer"
                      (click)="
                        s.prevDrillView.set('catDrill');
                        s.drillTask.set(ta);
                        s.view.set('taskDrill')
                      "
                    >
                      <td>{{ s.getEntry(ta.backlogEntryId)?.title }}</td>
                      <td>
                        {{ s.isLead() ? s.getMember(s.getAssignMember(ta))?.name : 'Team Member' }}
                      </td>
                      <td>{{ ta.committedHours }}h</td>
                      <td>{{ ta.hoursCompleted }}h</td>
                      <td>
                        <span class="tag" [class]="'stat-badge-' + ta.progressStatus">{{
                          s.statusLabel(ta.progressStatus)
                        }}</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <!-- VIEW: MEMBER DRILL -->
          @if (s.view() === 'memberDrill') {
            <div>
              <button class="button btn-secondary mb-4" (click)="s.view.set('dashboard')">
                ← Go Back
              </button>
              <h2 class="title is-4">{{ s.getMember(s.drillMember())?.name }}'s Plan</h2>
              <p class="mb-3">
                Hours completed: {{ s.dashMemberCompleted(s.drillMember() ?? '') }} of 30 ({{
                  pct(s.dashMemberCompleted(s.drillMember() ?? ''), 30)
                }}%)
              </p>
              <div class="progress-bar-outer mb-4">
                <div
                  class="progress-bar-inner is-ok"
                  [style.width]="pct(s.dashMemberCompleted(s.drillMember() ?? ''), 30) + '%'"
                ></div>
              </div>
              <table class="table is-fullwidth is-hoverable">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Committed</th>
                    <th>Done</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (ta of s.dashMemberAssignments(s.drillMember() ?? ''); track ta.id) {
                    <tr
                      style="cursor:pointer"
                      [class.overage]="ta.hoursCompleted > ta.committedHours"
                      (click)="
                        s.prevDrillView.set('memberDrill');
                        s.drillTask.set(ta);
                        s.view.set('taskDrill')
                      "
                    >
                      <td>{{ s.getEntry(ta.backlogEntryId)?.title }}</td>
                      <td>
                        <span
                          class="tag is-cat"
                          [class]="'cat-badge-' + s.getEntry(ta.backlogEntryId)?.category"
                          >{{ s.catLabel(s.getEntry(ta.backlogEntryId)?.category ?? '') }}</span
                        >
                      </td>
                      <td>{{ ta.committedHours }}h</td>
                      <td>{{ ta.hoursCompleted }}h</td>
                      <td>
                        <span class="tag" [class]="'stat-badge-' + ta.progressStatus">{{
                          s.statusLabel(ta.progressStatus)
                        }}</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <!-- VIEW: TASK DRILL -->
          @if (s.view() === 'taskDrill') {
            <div>
              <button class="button btn-secondary mb-4" (click)="s.view.set(s.prevDrillView())">
                ← Go Back
              </button>
              <h2 class="title is-4">
                {{ s.getEntry(s.drillTask()?.backlogEntryId ?? '')?.title }}
              </h2>
              <div class="box mb-4">
                <p>
                  <strong>Category:</strong>
                  <span
                    class="tag is-cat"
                    [class]="
                      'cat-badge-' + s.getEntry(s.drillTask()?.backlogEntryId ?? '')?.category
                    "
                    >{{
                      s.catLabel(s.getEntry(s.drillTask()?.backlogEntryId ?? '')?.category ?? '')
                    }}</span
                  >
                </p>
                @if (s.getEntry(s.drillTask()?.backlogEntryId ?? '')?.description) {
                  <p>
                    <strong>Description:</strong>
                    {{ s.getEntry(s.drillTask()?.backlogEntryId ?? '')?.description }}
                  </p>
                }
                @if (s.getEntry(s.drillTask()?.backlogEntryId ?? '')?.estimatedEffort) {
                  <p>
                    <strong>Estimate:</strong>
                    {{ s.getEntry(s.drillTask()?.backlogEntryId ?? '')?.estimatedEffort }}h
                  </p>
                }
                <p>
                  <strong>Assigned to:</strong>
                  {{ s.getMember(s.getAssignMember(s.drillTask()))?.name }}
                </p>
                <p><strong>Committed:</strong> {{ s.drillTask()?.committedHours }}h</p>
                <p><strong>Done:</strong> {{ s.drillTask()?.hoursCompleted }}h</p>
                <p>
                  <strong>Status:</strong>
                  <span class="tag" [class]="'stat-badge-' + s.drillTask()?.progressStatus">{{
                    s.statusLabel(s.drillTask()?.progressStatus ?? '')
                  }}</span>
                </p>
              </div>
              @if (s.allEntryAssignments(s.drillTask()?.backlogEntryId ?? '').length > 1) {
                <div class="box mb-4">
                  <h4 class="title is-6">All members assigned to this item</h4>
                  <table class="table is-fullwidth is-size-7">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Committed</th>
                        <th>Done</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (
                        ta2 of s.allEntryAssignments(s.drillTask()?.backlogEntryId ?? '');
                        track ta2.id
                      ) {
                        <tr>
                          <td>{{ s.getMember(s.getAssignMember(ta2))?.name }}</td>
                          <td>{{ ta2.committedHours }}h</td>
                          <td>{{ ta2.hoursCompleted }}h</td>
                          <td>
                            <span class="tag" [class]="'stat-badge-' + ta2.progressStatus">{{
                              s.statusLabel(ta2.progressStatus)
                            }}</span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
              <h4 class="title is-6">Update History</h4>
              @if (s.taskProgressHistory(s.drillTask()?.id).length === 0) {
                <div class="notification is-app-info">No progress updates yet.</div>
              }
              @for (pu of s.taskProgressHistory(s.drillTask()?.id); track pu.id) {
                <div class="box mb-2 is-size-7">
                  <p>
                    <strong>{{ pu.timestamp | date: 'medium' }}</strong> —
                    {{ s.getMember(pu.updatedBy)?.name || 'Unknown' }}
                  </p>
                  <p>
                    Hours: {{ pu.previousHoursCompleted }} → {{ pu.newHoursCompleted }} | Status:
                    {{ s.statusLabel(pu.previousStatus) }} → {{ s.statusLabel(pu.newStatus) }}
                  </p>
                  @if (pu.note) {
                    <p class="text-secondary">Note: {{ pu.note }}</p>
                  }
                </div>
              }
            </div>
          }

          <!-- VIEW: PAST CYCLES -->
          @if (s.view() === 'pastCycles') {
            <div>
              <button class="button btn-secondary mb-4" (click)="s.goHome()">← Home</button>
              <h2 class="title is-4">Past Weeks</h2>
              @if (s.pastCycles().length === 0) {
                <div class="notification is-app-info">No past weeks yet.</div>
              }
              @for (c of s.pastCycles(); track c.id) {
                <div
                  class="box mb-2 action-card"
                  (click)="s.dashCycleId.set(c.id); s.view.set('dashboard')"
                >
                  <div class="columns is-vcentered is-mobile">
                    <div class="column">
                      <strong>Week of {{ c.planningDate }}</strong
                      ><span
                        class="tag ml-2"
                        [class]="c.state === 'COMPLETED' ? 'is-success' : 'is-info'"
                        >{{ c.state }}</span
                      >
                    </div>
                    <div class="column is-narrow">
                      <span class="text-secondary"
                        >{{ c.participatingMemberIds.length }} members</span
                      ><button class="button is-small btn-secondary ml-2">View Details →</button>
                    </div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- CONFIRM MODAL -->
          <div class="modal" [class.is-active]="s.confirmModal()">
            <div class="modal-background" (click)="s.confirmModal.set(false)"></div>
            <div class="modal-card">
              <header class="modal-card-head">
                <p class="modal-card-title">{{ s.confirmTitle() }}</p>
                <button class="delete" (click)="s.confirmModal.set(false)"></button>
              </header>
              <section
                class="modal-card-body"
                style="background:var(--bg-surface);color:var(--text-primary)"
              >
                <p>{{ s.confirmText() }}</p>
              </section>
              <footer class="modal-card-foot">
                <button
                  class="button"
                  [class]="s.confirmDanger() ? 'btn-danger' : 'btn-primary'"
                  (click)="runConfirm()"
                >
                  {{ s.confirmYes() }}
                </button>
                <button class="button btn-secondary" (click)="s.confirmModal.set(false)">
                  {{ s.confirmNo() || 'No, Go Back' }}
                </button>
              </footer>
            </div>
          </div>
        </div>
        <!-- container -->
      </main>

      <!-- FOOTER -->
      @if (s.appSettings().setupComplete) {
        <footer class="footer-bar">
          <div class="container has-text-centered" style="max-width:960px">
            <button class="button is-small btn-secondary mr-2" (click)="s.exportData()">
              📥 Download My Data
            </button>
            <button class="button is-small btn-secondary mr-2" (click)="s.importModal.set(true)">
              📤 Load Data from File
            </button>
            <button class="button is-small btn-secondary mr-2" (click)="s.seedData()">
              🌱 Seed Sample Data
            </button>
            <button class="button is-small btn-danger" (click)="s.resetAll()">🗑️ Reset App</button>
          </div>
        </footer>
      }

      <!-- IMPORT MODAL -->
      <div class="modal" [class.is-active]="s.importModal()">
        <div class="modal-background" (click)="s.importModal.set(false)"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Load Data from a Backup File</p>
            <button class="delete" (click)="s.importModal.set(false)"></button>
          </header>
          <section
            class="modal-card-body"
            style="background:var(--bg-surface);color:var(--text-primary)"
          >
            <p class="mb-3">
              Pick the backup file you saved before. This will replace all your current data.
            </p>
            <div class="field">
              <div class="file has-name">
                <label class="file-label"
                  ><input
                    class="file-input"
                    type="file"
                    accept=".json"
                    (change)="s.handleImportFile($event)"
                  /><span class="file-cta"><span class="file-label">Choose file</span></span
                  ><span class="file-name">{{
                    s.importFileName() || 'No file chosen'
                  }}</span></label
                >
              </div>
            </div>
            @if (s.importError()) {
              <p class="help has-text-danger">{{ s.importError() }}</p>
            }
          </section>
          <footer class="modal-card-foot">
            <button
              class="button btn-danger"
              [disabled]="!s.importData()"
              (click)="s.executeImport()"
            >
              Yes, Replace My Data
            </button>
            <button
              class="button btn-secondary"
              (click)="s.importModal.set(false); s.importData.set(null); s.importFileName.set('')"
            >
              Cancel
            </button>
          </footer>
        </div>
      </div>
    </div>
    <!-- theme root -->
  `,
})
export class App implements OnInit {
  constructor(public s: AppStateService) {}

  ngOnInit() {
    this.s.init();
  }

  pct(val: number, total: number) {
    return Math.min(100, Math.round((val / Math.max(1, total)) * 100));
  }

  toggleBlFilter(key: string) {
    this.s.blFilter.update((f) => ({ ...f, [key]: !(f as any)[key] }));
  }
  setBlStatus(v: string) {
    this.s.blFilter.update((f) => ({ ...f, status: v }));
  }
  setBlSearch(v: string) {
    this.s.blFilter.update((f) => ({ ...f, search: v }));
  }
  setBacklogField(k: string, v: any) {
    this.s.backlogForm.update((f) => ({ ...f, [k]: v }));
  }
  setCycleField(k: string, v: any) {
    this.s.cycleForm.update((f) => ({ ...f, [k]: v }));
  }
  toggleCycleMember(id: string, ev: Event) {
    const checked = (ev.target as HTMLInputElement).checked;
    this.s.cycleForm.update((f) => ({
      ...f,
      memberIds: checked ? [...f.memberIds, id] : f.memberIds.filter((x: string) => x !== id),
    }));
  }
  toggleClaimCat(cat: string) {
    this.s.claimCatFilter.update((f) => ({ ...f, [cat]: !f[cat] }));
  }
  setProgField(k: string, v: any) {
    this.s.progForm.update((f) => ({ ...f, [k]: v }));
  }
  toggleFreezeDetail(mid: string) {
    this.s.freezeDetailMember.update((v) => (v === mid ? null : mid));
  }
  runConfirm() {
    this.s.confirmAction()();
    this.s.confirmModal.set(false);
  }

  deleteEntry(id: string) {
    this.s.showConfirm(
      'Delete this item?',
      'This will permanently remove it. This cannot be undone.',
      () => {
        this.s.backlogEntries.update((es) => es.filter((e) => e.id !== id));
        this.s.save();
        this.s.showToast('Deleted!');
      },
      'Yes, Delete It',
      true,
    );
  }
}
