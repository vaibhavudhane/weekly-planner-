import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Member } from '../../models';
import { RoleService } from '../../services/role.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatFormFieldModule,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnInit {
  members: Member[] = [];
  selected!: Member;
  isDark = signal(false);

  constructor(
    public roleSvc: RoleService,
    public router: Router,
  ) {}

  ngOnInit() {
    this.members = this.roleSvc.getMembers();
    this.selected = this.roleSvc.getCurrent();
  }

  onSwitch(m: Member) {
    this.roleSvc.switchTo(m);
    this.router.navigate(['/planning']);
  }

  toggleDark() {
    this.isDark.update((v) => !v);
    document.body.classList.toggle('dark-theme');
  }

  isLead() {
    return this.roleSvc.isLead();
  }

  compareMembers(a: Member, b: Member) {
    return a?.id === b?.id;
  }
}
