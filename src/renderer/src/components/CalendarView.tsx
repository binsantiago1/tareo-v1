import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { ItemDialog } from '@renderer/components/ItemDialog'
import { PriorityMark } from '@renderer/components/PriorityMark'
import { todayString } from '@renderer/lib/dates'
import { cn } from '@renderer/lib/utils'
import { useDataStore } from '@renderer/store/useDataStore'
import { isOverdue } from '../../../shared/taskRules'
import { sortTasks } from '../../../shared/sorting'
import type { Task } from '../../../shared/types'

// La semana empieza en lunes (costumbre en español).
const WEEK_OPTIONS = { weekStartsOn: 1 } as const
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Vista Calendario: tareas pendientes con fecha límite en su día; las sin fecha, debajo. */
export function CalendarView(): React.JSX.Element {
  const data = useDataStore((s) => s.data)
  const updateTask = useDataStore((s) => s.updateTask)
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [editing, setEditing] = useState<Task | null>(null)

  const today = todayString()
  const areaNames = useMemo(() => new Map(data.areas.map((a) => [a.id, a.name])), [data.areas])

  const { byDay, undated } = useMemo(() => {
    const pending = sortTasks(
      data.tasks.filter((t) => !t.completed),
      'prioridad'
    )
    const byDay = new Map<string, Task[]>()
    const undated: Task[] = []
    for (const task of pending) {
      if (!task.dueDate) {
        undated.push(task)
        continue
      }
      byDay.set(task.dueDate, [...(byDay.get(task.dueDate) ?? []), task])
    }
    return { byDay, undated }
  }, [data.tasks])

  const days = eachDayOfInterval({
    start: startOfWeek(month, WEEK_OPTIONS),
    end: endOfWeek(endOfMonth(month), WEEK_OPTIONS)
  })

  const undatedByArea = data.areas
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((area) => ({ area, tasks: undated.filter((t) => t.areaId === area.id) }))
    .filter((group) => group.tasks.length > 0)

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <section aria-label="Calendario" className="grid gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-2xl font-semibold" aria-live="polite">
            {capitalize(format(month, "MMMM 'de' yyyy", { locale: es }))}
          </h2>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label="Mes anterior"
              onClick={() => setMonth((m) => subMonths(m, 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" onClick={() => setMonth(startOfMonth(new Date()))}>
              Hoy
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Mes siguiente"
              onClick={() => setMonth((m) => addMonths(m, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border">
          {WEEKDAYS.map((name) => (
            <div
              key={name}
              className="bg-muted px-2 py-1 text-center text-xs font-medium text-muted-foreground"
            >
              {name}
            </div>
          ))}
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd')
            const dayTasks = byDay.get(key) ?? []
            const isToday = key === today
            return (
              <div
                key={key}
                role="group"
                aria-label={format(day, "d 'de' MMMM", { locale: es })}
                className={cn(
                  'flex min-h-24 min-w-0 flex-col gap-1 bg-card p-1',
                  !isSameMonth(day, month) && 'bg-muted/50 text-muted-foreground'
                )}
              >
                <span
                  className={cn(
                    'flex size-6 items-center justify-center self-end rounded-full text-xs',
                    isToday && 'bg-primary font-semibold text-primary-foreground'
                  )}
                  aria-label={isToday ? `${format(day, 'd')}, hoy` : undefined}
                >
                  {format(day, 'd')}
                </span>
                {dayTasks.map((task) => (
                  <TaskChip
                    key={task.id}
                    task={task}
                    areaName={areaNames.get(task.areaId)}
                    overdue={isOverdue(task.dueDate, today)}
                    onOpen={() => setEditing(task)}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </section>

      <section aria-label="Tareas sin fecha límite" className="grid gap-3">
        <h2 className="text-xl font-semibold">Sin fecha límite</h2>
        {undatedByArea.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay tareas pendientes sin fecha límite.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {undatedByArea.map(({ area, tasks }) => (
              <div key={area.id} className="grid content-start gap-1 rounded-lg border bg-card p-3">
                <h3 className="text-sm font-semibold">{area.name}</h3>
                {tasks.map((task) => (
                  <TaskChip
                    key={task.id}
                    task={task}
                    areaName={area.name}
                    overdue={false}
                    onOpen={() => setEditing(task)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      <ItemDialog
        key={editing?.id}
        kind="tarea"
        initial={{
          title: editing?.title ?? '',
          note: editing?.note ?? '',
          priority: editing?.priority ?? 0,
          dueDate: editing?.dueDate
        }}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        onSave={(values) => editing && updateTask(editing.id, values)}
      />
    </div>
  )
}

function TaskChip({
  task,
  areaName,
  overdue,
  onOpen
}: {
  task: Task
  areaName?: string
  overdue: boolean
  onOpen: () => void
}): React.JSX.Element {
  const description = [`«${task.title}»`, areaName && `área ${areaName}`, overdue && 'vencida']
    .filter(Boolean)
    .join(', ')

  return (
    <button
      type="button"
      onClick={onOpen}
      title={areaName ? `${task.title} (${areaName})` : task.title}
      aria-label={`Editar tarea ${description}`}
      className={cn(
        'flex w-full min-w-0 items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-left text-xs hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        overdue && 'border border-destructive font-medium text-destructive'
      )}
    >
      <PriorityMark priority={task.priority} />
      <span className="truncate">{task.title}</span>
    </button>
  )
}
