import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TodoService } from '@services/todo.service';
import { NgScrollbarModule } from 'ngx-scrollbar';

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [
    FormsModule,
    NgScrollbarModule,
    NgClass
  ],
  templateUrl: './todo.component.html',
  styleUrl: './todo.component.scss',
  providers: [TodoService]
})
export class TodoComponent {
  public todoList: Array<any>;
  public newTodoText: string = '';

  constructor(private _todoService: TodoService) {
    this.todoList = this._todoService.getTodoList();
  }

  public getNotDeleted() {
    return this.todoList.filter((item: any) => {
      return !item.deleted
    })
  }

  public addToDoItem($event: any) {
    if (($event.which === 1 || $event.which === 13) && this.newTodoText.trim() != '') {
      this.todoList.unshift({
        text: this.newTodoText
      });
      this.newTodoText = '';
    }
  }

}
