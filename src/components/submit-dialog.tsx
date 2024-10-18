import type {
  ManualEntry,
  AutoEntry,
  ResolvedEntryDocument,
} from '@/types/entry'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
} from '@/components/ui/dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addManualEntry, deleteEntry, updateEntry } from '@/lib/actions'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoaderPinwheelIcon } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { NumberInput } from '@/components/ui/number-input'
import { MultiSelect } from '@/components/ui/multi-select'
import { useClient } from '@/hooks/useClient'
import type { User } from '@/types/user'
import {
  capitalizeName,
  firstName,
  hashEmail,
  userToReference,
} from '@/lib/utils'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import type { AvatarProps } from '@radix-ui/react-avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface SubmitDialogProps {
  entry: ResolvedEntryDocument | null
  open: boolean
  onClose: () => void
  onSubmit: () => void
}

const USER_QUERY = `*[_type== "user"] | order(lower(title) asc)`

const formatTimeToHtmlInput = (date?: string) => {
  const dateObj = date ? new Date(date) : new Date()
  const hours = dateObj.getHours().toString().padStart(2, '0')
  const minutes = dateObj.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

const formatTimeToDate = (time?: string, date?: string) => {
  const currentDate = date
    ? new Date(date).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]
  return new Date(`${currentDate}T${time}:00`).toISOString()
}

type FormValues = ManualEntry | AutoEntry

const MotionFormItem = motion(FormItem)

export const SubmitDialog = ({
  entry,
  open,
  onClose,
  onSubmit,
}: SubmitDialogProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const form = useForm<FormValues>({
    defaultValues: {
      location: 'inside',
      pees: 0,
      poops: 0,
      startTime: formatTimeToHtmlInput(),
      endTime: formatTimeToHtmlInput(),
      users: [],
    },
  })

  const isOutside = form.watch('location') === 'outside'

  const [isUserSelectOpen, setIsUserSelectOpen] = useState(false)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const { data: allUsers } = useClient<User[]>(USER_QUERY)
  const allUserOptions = useMemo(() => {
    return (
      allUsers?.map((user) => ({
        label: capitalizeName(user.name),
        shortLabel: firstName(user.name),
        value: hashEmail(user.email),
        icon: (props: AvatarProps) => (
          <Avatar {...props}>
            <AvatarImage src={user.image || undefined} />
          </Avatar>
        ),
      })) || []
    )
  }, [allUsers])
  const defaultUsers = useMemo(() => {
    return entry?.users?.map((user) => hashEmail(user.email)) || []
  }, [entry])

  const isEntryUnderAMinute = useMemo(() => {
    if (!entry) return false
    const startTime = new Date(entry.startTime).getTime()
    const currentTime = new Date().getTime()
    return currentTime - startTime < 60 * 1000
  }, [entry, open])

  useEffect(() => {
    form.reset({
      location: entry?.location || 'inside',
      pees: entry?.pees || 0,
      poops: entry?.poops || 0,
      startTime: formatTimeToHtmlInput(entry?.startTime),
      endTime: formatTimeToHtmlInput(entry?.endTime),
      users: entry?.users?.map(userToReference),
    })
  }, [entry, open, form])

  const onSubmitForm = async (data: FormValues) => {
    setIsLoading(true)

    const formattedData = {
      startTime: formatTimeToDate(data.startTime, entry?.startTime),
      endTime: isOutside
        ? formatTimeToDate(data.endTime, entry?.endTime)
        : undefined,
      pees: data.pees,
      poops: data.poops,
      location: entry?.mode === 'auto' ? 'outside' : data.location,
      users: data.users,
    }

    if (entry) {
      await updateEntry(entry._id, formattedData as AutoEntry)
    } else {
      await addManualEntry(formattedData as ManualEntry)
    }

    setIsLoading(false)
    onSubmit()
  }

  const handleDelete = async () => {
    if (!entry) return

    setIsLoading(true)
    deleteEntry(entry._id)
    setIsLoading(false)
    onSubmit()
  }

  const handleDialogClose = () => {
    if (!isUserSelectOpen) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent
        className="p-4 max-w-sm !w-[90dvw] text-center overflow-hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="mb-1">
          <DialogDescription>
            {entry
              ? 'Add information about the trip'
              : 'Manually add information about the trip'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitForm)}>
            {!entry && (
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Where was Ani?</FormLabel>
                    <FormControl>
                      <Tabs
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <TabsList>
                          <TabsTrigger value="inside">Inside</TabsTrigger>
                          <TabsTrigger value="outside">Outside</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="pees"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>How many times did Ani pee?</FormLabel>
                  <FormControl>
                    <NumberInput
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="poops"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>How many times did she poop?</FormLabel>
                  <FormControl>
                    <NumberInput
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <motion.fieldset
              className="grid gap-3 mb-4 mx-auto w-full grid-cols-2"
              initial={{ marginLeft: isOutside ? 0 : '25%' }}
              animate={{ marginLeft: isOutside ? 0 : '25%' }}
            >
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isOutside ? 'Start time' : 'Mischief time?'}
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <AnimatePresence initial={false}>
                {isOutside && (
                  <motion.div
                    key="endTime"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <MotionFormItem>
                          <FormLabel>End time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </MotionFormItem>
                      )}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.fieldset>

            <AnimatePresence initial={false}>
              {isOutside && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.6, ease: 'anticipate' }}
                >
                  <FormField
                    control={form.control}
                    name="users"
                    render={({ field }) => (
                      <FormItem className="mb-5">
                        <FormLabel>Who went on the walk?</FormLabel>
                        <FormControl>
                          <MultiSelect
                            placeholder="Select walkers"
                            defaultValue={defaultUsers}
                            options={allUserOptions}
                            onValueChange={(value: string[]) =>
                              field.onChange(
                                value.map((_ref) => ({
                                  _type: 'reference',
                                  _ref,
                                }))
                              )
                            }
                            value={field.value?.map((u) => u._ref) || []}
                            onOpenChange={setIsUserSelectOpen}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <footer className="flex gap-2 bg-background relative z-10">
              {entry?.status === 'completed' && (
                <AlertDialog
                  open={isDeleteAlertOpen}
                  onOpenChange={setIsDeleteAlertOpen}
                >
                  <AlertDialogTrigger
                    type="button"
                    className={buttonVariants({
                      variant: 'destructive',
                      className: 'w-full',
                    })}
                    disabled={isLoading}
                  >
                    Delete
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-xs">
                    <AlertDialogHeader>
                      Are you sure you want to delete this walk?
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Avbryt</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className={buttonVariants({ variant: 'destructive' })}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {entry?.status === 'active' && isEntryUnderAMinute && (
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => {
                    handleDelete()
                    toast.info('The walk was cancelled and deleted', {
                      id: 'delete-entry',
                    })
                  }}
                  disabled={isLoading}
                  variant="destructive"
                >
                  Abort walk
                </Button>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && (
                  <LoaderPinwheelIcon className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save walk
              </Button>
            </footer>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
