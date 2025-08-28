import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { PuzzleService } from 'src/app/Services/puzzle.service';

interface PuzzleTile {
  index: number;
  url: string;
}

interface Puzzle {
  puzzleId: string;
  rows: number;
  cols: number;
  imageWidth: number;
  imageHeight: number;
  originalImageUrl?: string;
  tiles: PuzzleTile[];
}

@Component({
  selector: 'app-puzzle',
  templateUrl: './puzzle.component.html',
  styleUrls: ['./puzzle.component.scss']
})
export class PuzzleComponent implements OnInit {
  @ViewChild('fileInput') fileInputRef!: ElementRef;

  puzzle: Puzzle | any = null;
  sizes: number[] = Array.from({length: 9}, (_,i) => i+2);
  selectedFile: File| null = null;
  previewUrl: string | ArrayBuffer | null = null;
  puzzleId?: string;
  tiles: (PuzzleTile | null)[] = []; 
  emptyIndex = -1;
  isLoading: boolean = false;
  showIndices: boolean = false;
  difficulty: string = localStorage.getItem('difficulty') || 'Easy';
  timer: any = null;
  elapsedTime: number = 0;
  timerStarted: boolean = false;
  moveCount: number = 0;
  newPuzzle = { rows: 2 };
  

  constructor(private puzzleSvc: PuzzleService) { }

  ngOnInit(): void {
    this.loadPuzzleByDifficulty();
  }

  loadPuzzleByDifficulty(){
    this.puzzleSvc.getRandomPuzzleIdByDifficulty(this.difficulty).subscribe({
      next: (res:any)=>{
        this.puzzleId = res;
        this.loadPuzzle();
      },
      error: (err)=>{
        console.log(err);
      }
    });
  }

  get formattedTime() : string{
    const mins = Math.floor(this.elapsedTime / 60);
    const secs = this.elapsedTime % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  toggleIndices(){
    this.showIndices = !this.showIndices;
  }

  onDifficultyChange() {
    localStorage.setItem('difficulty', this.difficulty);
    this.loadPuzzleByDifficulty();
  }

  onFileSelected(event: Event){
    const input = event.target as HTMLInputElement;
    if(input.files && input.files.length){
      this.selectedFile = input.files[0];

      //preview
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onSubmit(form: NgForm){
    if(!form.valid || !this.selectedFile) return;

    this.isLoading = true;
    const formData = new FormData();
    formData.append('rows', this.newPuzzle.rows.toString());
    formData.append('cols', this.newPuzzle.rows.toString());
    if(this.selectedFile){
      formData.append('image', this.selectedFile);
    }

    this.puzzleSvc.createPuzzle(formData).subscribe({
      next: (puzzle:any) =>{
        this.puzzle = puzzle;
        this.tiles = [...puzzle.tiles, null];
        this.emptyIndex = this.tiles.length - 1;
        this.shuffleTiles();

        this.newPuzzle = { rows: 2 };
        this.selectedFile = null;
        if(this.fileInputRef){
          this.fileInputRef.nativeElement.value = '';
        }
        this.previewUrl = null;
        this.isLoading = false;

      },
      error: (err:any)=>{
        console.log(err);
        this.isLoading = false;
      }
    })


  }

  loadPuzzle() {
    this.isLoading = true;
    this.puzzleSvc.getPuzzle(this.puzzleId!)
      .subscribe({
        next: (puzzle:any) => {
          console.log(puzzle);
        this.puzzle = puzzle;
        this.tiles = [...puzzle.tiles];
        this.emptyIndex = this.tiles.length - 1;
        this.shuffleTiles();
        this.isLoading = false;
        },
        error: (err:any) => {
          console.log(err.error.message);
          this.isLoading = false;
        }
      });
  }

  shuffleTiles() {
    if (!this.puzzle) return;
    this.moveCount = 0;
    this.stopTimer();
    this.elapsedTime = 0;
    this.timerStarted = false

    this.tiles = [...this.puzzle.tiles];
    this.emptyIndex = this.tiles.length - 1;
    var moves = 200;
    if(this.puzzle.cols >= 5){
      moves = 2000;
    }

    for(let i = 0; i < moves; i++){
      const neighbors = this.getNeighbors(this.emptyIndex);
      const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
      [this.tiles[this.emptyIndex], this.tiles[randomNeighbor]] = [this.tiles[randomNeighbor], this.tiles[this.emptyIndex]];
      this.emptyIndex = randomNeighbor;
    }
  }

  getNeighbors(index: number): number[] {
    if(!this.puzzle) return [];
    const neighbours: number[] = [];
    const row = Math.floor(index / this.puzzle.cols);
    const col = index % this.puzzle.cols;

    if(row > 0) neighbours.push(index - this.puzzle.cols); //up
    if(row < this.puzzle.rows - 1) neighbours.push(index + this.puzzle.cols); // down
    if(col > 0) neighbours.push(index - 1); // left
    if(col < this.puzzle.cols - 1) neighbours.push(index + 1); //right

    return neighbours;
  }

  moveTile(index: number){
    if(this.canMove(index)){
      if(!this.timerStarted){
        this.timerStarted = true;
        this.startTimer();
      }
      [this.tiles[index], this.tiles[this.emptyIndex]] = [this.tiles[this.emptyIndex], this.tiles[index]];
      this.emptyIndex = index;
      this.moveCount++;
      if(this.isSolved()){
        this.stopTimer();
      }
    }
  }

  startTimer(){
    this.elapsedTime = 0;
    this.timer = setInterval(() => {
      this.elapsedTime++;
    }, 1000);
  }

  stopTimer(){
    clearInterval(this.timer);
    this.timerStarted = false;
  }


  canMove(index: number): boolean{
    if(!this.puzzle) return false;
    const row = Math.floor(index / this.puzzle.cols);
    const col = index % this.puzzle.cols;
    const emptyRow = Math.floor(this.emptyIndex / this.puzzle.cols);
    const emptyCol = this.emptyIndex % this.puzzle.cols;
    return (
      (row === emptyRow && Math.abs(col - emptyCol) === 1) ||
      (col === emptyCol && Math.abs(row-emptyRow) === 1)
    );
  }

  isSolved(): boolean {
    if (!this.puzzle) return false;
    return this.tiles.every((tile,i) => tile?.index === i);
  }

  restartGame() {
    if (!this.puzzle) return;
    this.moveCount = 0;
    this.shuffleTiles();
    this.stopTimer();
    this.elapsedTime = 0;
    this.timerStarted = false;
  }

}
