import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BacklogItem } from '../../models';
import { BacklogService } from '../../services/backlog.service';
import { RoleService } from '../../services/role.service';

@Component({
  selector: 'app-backlog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './backlog.html',
  styleUrl: './backlog.scss',
})
export class Backlog implements OnInit {
  items: BacklogItem[] = [];
  filtered: BacklogItem[] = [];
  isLoading = true;
  errorMessage = '';
  filterCat = 0;
  showForm = false;
  newItem: Partial<BacklogItem> = { title: '', description: '', category: 1 };

  constructor(
    private backlogSvc: BacklogService,
    public roleSvc: RoleService,
  ) {}

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    this.isLoading = true;
    this.backlogSvc.getAll().subscribe({
      next: (items) => {
        this.items = items;
        this.filtered = items;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load backlog.';
        this.isLoading = false;
      },
    });
  }

  applyFilter(cat: number) {
    this.filterCat = cat;
    this.filtered = cat === 0 ? this.items : this.items.filter((i) => i.category === cat);
  }

  categoryLabel(cat: number) {
    return ['All', 'Client Focused', 'Tech Debt', 'R&D'][cat];
  }

  addItem() {
    if (!this.newItem.title) return;
    this.backlogSvc.create(this.newItem as BacklogItem).subscribe({
      next: () => {
        this.showForm = false;
        this.newItem = { title: '', description: '', category: 1 };
        this.loadItems();
      },
      error: () => {
        this.errorMessage = 'Failed to create item.';
      },
    });
  }

  deleteItem(id: number) {
    this.backlogSvc.delete(id).subscribe({ next: () => this.loadItems() });
  }
}
