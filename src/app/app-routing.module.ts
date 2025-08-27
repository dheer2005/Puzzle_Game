import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PuzzleComponent } from './pages/puzzle/puzzle.component';

const routes: Routes = [
  { path: '', redirectTo: '/puzzle', pathMatch: 'full'},
  { path: 'puzzle', component: PuzzleComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
