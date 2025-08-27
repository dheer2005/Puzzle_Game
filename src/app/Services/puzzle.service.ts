import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PuzzleService {
  // apiUrl: any= `https://localhost:7118/api/Puzzle/`;
  apiUrl: any= `https://puzzle.bsite.net/api/Puzzle/`;

  constructor(private http: HttpClient) { }

  getRandomPuzzleId(){
    return this.http.get(`${this.apiUrl}randomPuzzleId`);
  }

  createPuzzle(data: any){
    return this.http.post(`${this.apiUrl}create`, data);
  }

  getPuzzle(puzzleId: string){
    return this.http.get(`${this.apiUrl}getPuzzle/${puzzleId}`)
  }
}
