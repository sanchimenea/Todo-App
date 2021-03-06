import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader,
  Rating,
  GridRow,
  Dropdown,
  Container
} from 'semantic-ui-react'

import { createTodo, deleteAttach, deleteTodo, getTodos, patchTodo } from '../api/todos-api'
import Auth from '../auth/Auth'
import { Todo } from '../types/Todo'

interface TodosProps {
  auth: Auth
  history: History
}

interface TodosState {
  todos: Todo[]
  newTodoName: string
  loadingTodos: boolean
}

export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    todos: [],
    newTodoName: '',
    loadingTodos: true
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoName: event.target.value })
  }

  onEditButtonClick = (todoId: string) => {
    this.props.history.push(`/todos/${todoId}/edit`)
  }

  onTodoCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const newTodo = await createTodo(this.props.auth.getIdToken(), {
        name: this.state.newTodoName,
      })
      this.setState({
        todos: [...this.state.todos, newTodo],
        newTodoName: ''
      })
    } catch {
      alert('Todo creation failed')
    }
  }

  onTodoDelete = async (todoId: string) => {
    try {
      await deleteTodo(this.props.auth.getIdToken(), todoId)
      this.setState({
        todos: this.state.todos.filter(todo => todo.todoId != todoId)
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  onAttachDelete = async (attachId: string, todoId: string, pos: number) => {
    try {
      console.log("Delete", attachId, todoId)

      await deleteAttach(this.props.auth.getIdToken(), todoId, attachId)
      const todo = this.state.todos[pos]
      const attachments = todo.attachments
      if (attachments) {
        delete attachments[attachId]
      }
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { attachments: { $set: attachments } }
        })
      })
      this.forceUpdate()
    } catch {
      alert('Attach deletion failed')
    }
  }

  onTodoCheck = async (pos: number, isImportant: boolean = false, isDueDate: number = -1) => {
    try {
      const todo = this.state.todos[pos]
      let updateValues
      let posValue
      if (isImportant) {
        updateValues = {
          done: todo.done,
          important: !todo.important
        }
        posValue = { important: { $set: !todo.important } }
      } else {
        updateValues = {
          done: !todo.done,
          important: todo.important
        }
        posValue = { done: { $set: !todo.done } }
      }
      if (isDueDate >= 0) {
        const newDueDate = this.calculateDueDate(isDueDate)
        updateValues = {
          done: todo.done,
          important: todo.important,
          dueDate: newDueDate
        }
        posValue = { dueDate: { $set: newDueDate } }
      } else if (isDueDate == -2) {
        updateValues = {
          done: todo.done,
          important: todo.important,
          dueDate: "delete"
        }
        posValue = { dueDate: { $set: "" } }
      }
      await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
        name: todo.name,
        ...updateValues
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: posValue
        })
      })
    } catch {
      alert('Todo update failed')
    }
  }

  async componentDidMount() {
    try {
      const todos = await getTodos(this.props.auth.getIdToken())
      this.setState({
        todos,
        loadingTodos: false
      })
    } catch (e) {
      alert(`Failed to fetch todos: ${e.message}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">TODOs</Header>

        {this.renderCreateTodoInput()}

        {this.renderTodos()}
      </div>
    )
  }

  renderCreateTodoInput() {
    return (
      <Grid>
        <Grid.Row>
          <Grid.Column width={16}>
            <Input
              action={{
                color: 'teal',
                labelPosition: 'left',
                icon: 'add',
                content: 'New task',
                onClick: this.onTodoCreate
              }}
              fluid
              actionPosition="left"
              value={this.state.newTodoName}
              placeholder="To change the world..."
              onChange={this.handleNameChange}
            />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={16} textAlign="right">
            <Dropdown
              text='Sort TODOs'
              icon='filter'
              floating
              labeled
              button
              className='icon'
            >
              <Dropdown.Menu>
                <Dropdown.Header content="Created At" />
                <Dropdown.Divider />
                <Dropdown.Item text='Ascending' onClick={() => { this.sortCreatedAt() }}></Dropdown.Item>
                <Dropdown.Item text='Descending' onClick={() => { this.sortCreatedAt(true) }}></Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Grid.Column>
          <Grid.Column width={16}>
            <Divider />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    )
  }

  sortCreatedAt(descending = false) {
    if (descending) {
      this.setState({
        todos: this.state.todos.slice().sort((a, b) => {
          return new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
        }).reverse()
      })
    }
    else {
      this.setState({
        todos: this.state.todos.slice().sort((a, b) => {
          return new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
        })
      })
    }

  }

  renderTodos() {
    if (this.state.loadingTodos) {
      return this.renderLoading()
    }

    return this.renderTodosList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading TODOs
        </Loader>
      </Grid.Row>
    )
  }

  renderName(todo: Todo) {
    if (!todo.done)
      return (
        <p>{todo.name}</p>
      )
    else {
      return (
        <p><s>{todo.name}</s></p>
      )
    }
  }

  renderDueDate(todo: Todo, pos: number) {
    let text = "Due: " + todo.dueDate
    if (!todo.dueDate) {
      text = '+ Add due date'
      return (
        <Container>
          <Icon name="calendar alternate outline" color="blue" />
          <Dropdown
            text={text}
          >
            <Dropdown.Menu>
              <Dropdown.Item icon='circle' text='Today' onClick={() => this.onTodoCheck(pos, false, 0)}></Dropdown.Item>
              <Dropdown.Item icon='chevron right' text='Tomorrow' onClick={() => this.onTodoCheck(pos, false, 1)}></Dropdown.Item>
              <Dropdown.Item icon='angle double right' text='Next Week' onClick={() => this.onTodoCheck(pos, false, 7)}></Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Container>
      )
    } else {
      return (
        <Container>
          <Icon name="calendar alternate outline" color="blue" />
          <Dropdown
            text={text}
          >
            <Dropdown.Menu>
              <Dropdown.Item icon='circle' text='Today' onClick={() => this.onTodoCheck(pos, false, 0)}></Dropdown.Item>
              <Dropdown.Item icon='chevron right' text='Tomorrow' onClick={() => this.onTodoCheck(pos, false, 1)}></Dropdown.Item>
              <Dropdown.Item icon='angle double right' text='Next Week' onClick={() => this.onTodoCheck(pos, false, 7)}></Dropdown.Item>
              <Dropdown.Item icon='delete calendar' text='Delete due date' onClick={() => this.onTodoCheck(pos, false, -2)}></Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Container>
      )
    }
  }

  renderAttachments(todo: Todo, pos: number) {

    if (!todo.attachments) {
      return
    }
    else {
      const attachArray = Object.entries(todo.attachments)
      return (
        attachArray.map((attach, idx) => {
          return (
            <Grid.Column key={attach[0]} width={16} style={{ marginBottom: "2px" }}>
              <a href={attach[1].attachmentUrl} style={{ marginRight: "15px" }}>{attach[1].name}</a>
              <Button
                icon
                compact inverted
                color="red"
                size="mini"
                onClick={() => this.onAttachDelete(attach[0], todo.todoId, pos)}
              >
                <Icon name="delete" />
              </Button>
            </Grid.Column>
          )
        })
      )
    }
  }



  renderTodosList() {
    return (
      <Grid padded>
        {this.state.todos.map((todo, pos) => {
          return (
            <Grid.Row key={todo.todoId}>
              <Grid.Column width={1} verticalAlign="middle">
                <Checkbox
                  onChange={() => this.onTodoCheck(pos)}
                  checked={todo.done}
                />
              </Grid.Column>
              <Grid.Column width={9} verticalAlign="middle">
                {this.renderName(todo)}
              </Grid.Column>
              <Grid.Column width={3} floated="right" verticalAlign="middle">
                {this.renderDueDate(todo, pos)}
              </Grid.Column>
              <Grid.Column width={1} floated="right" verticalAlign="middle">
                <Rating
                  icon="star"
                  onRate={() => this.onTodoCheck(pos, true)}
                  rating={todo.important ? 1 : 0}
                />
              </Grid.Column>
              <Grid.Column width={1} floated="right" verticalAlign="middle">
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(todo.todoId)}
                >
                  <Icon name="attach" />
                </Button>
              </Grid.Column>
              <Grid.Column width={1} floated="right" verticalAlign="middle">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onTodoDelete(todo.todoId)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>

              {this.renderAttachments(todo, pos)}
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  calculateDueDate(days: number): string {
    const date = new Date()
    date.setDate(date.getDate() + days)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}
