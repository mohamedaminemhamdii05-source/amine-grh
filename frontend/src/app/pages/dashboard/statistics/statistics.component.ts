import { Component } from '@angular/core';
import { ClientService } from '../../../core/services/client.service';
import { ProjectService } from '../../../core/services/project.service';
import { UserService } from '../../../core/services/user.service';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    NgxChartsModule
  ],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.css'
})
export class StatisticsComponent {

  clients: any;
  projects: any;
  users: any;

  // theme colours (primary, success, warning, danger, info)
  colorScheme: any = { domain: ['#556ee6', '#34c38f', '#f1b44c', '#f46a6a', '#50a5f1'] };

  // chart 1: totals
  overviewData: any[] = [];

  // chart 2: projects by status
  statusData: any[] = [];

  // chart 3: budget per project
  budgetData: any[] = [];

  private statusLabels: any = { pending: 'Pending', completed: 'Completed', delay: 'Delayed' };

  constructor( private _client: ClientService, private _project: ProjectService, private _user: UserService ){}

  ngOnInit(): void {

    this.getAllClients();
    this.getAllProjects();
    this.getAllUsers();

  }

  getAllUsers(){
    this._user.list().subscribe({
      next: (res)=>{
        this.users = res;
        this.buildCharts();
      }
    })
  }

  getAllProjects(){
    this._project.list().subscribe({
      next: (res)=>{
        this.projects = res;
        this.buildCharts();
      }
    })
  }

  getAllClients(){
    this._client.list().subscribe({
      next: (res)=>{
        this.clients = res;
        this.buildCharts();
      }
    })
  }

  // charts are built from the real data once the three lists are loaded
  private buildCharts(){
    if (!this.clients || !this.projects || !this.users) {
      return;
    }

    this.overviewData = [
      { name: 'Projects', value: this.projects.length },
      { name: 'Employees', value: this.users.length },
      { name: 'Clients', value: this.clients.length }
    ];

    const counts: any = {};
    for (const project of this.projects) {
      const label = this.statusLabels[project.status] || 'Other';
      counts[label] = (counts[label] || 0) + 1;
    }
    this.statusData = Object.keys(counts).map((name) => ({ name, value: counts[name] }));

    this.budgetData = this.projects
      .filter((p: any) => typeof p.budget === 'number' && p.budget > 0)
      .map((p: any) => ({ name: p.name, value: p.budget }))
      .sort((a: any, b: any) => b.value - a.value);
  }

  formatBudget = (value: number) => '$ ' + Number(value).toLocaleString('en-US');

}
