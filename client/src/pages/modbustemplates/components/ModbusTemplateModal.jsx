import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import Input from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Save, Users } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { useEffect, useState } from 'react';
import UserMappingModal from './UserMappingModal';

const ModbusTemplateModal = ({
  open,
  onOpenChange,
  mode,
  template,
  onSave,
  disableSave,
  customers = [],
  users = []
}) => {
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';
  const isView = mode === 'view';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userMappingOpen, setUserMappingOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      driveCode: '',
      orgCode: '',
      parameters: '',
      users: ''
    }
  });

  /* ------------------------------
     Load form values
  ------------------------------ */
  useEffect(() => {
    if (!open) return;

    if (isCreate) {
      reset({
        name: '',
        driveCode: '',
        orgCode: '',
        parameters: '',
        users: ''
      });
      setSelectedUserIds([]);
    }

    if ((isEdit || isView) && template) {
      reset({
        name: template.name || '',
        driveCode: template.driveCode || '',
        orgCode: template.orgCode || '',
        parameters: template.parameters || '',
        users: template.users || ''
      });
      // Parse user IDs from comma-separated string and ensure all are strings
      const userIds = (template.users || '').split(',').filter(Boolean).map(String);
      setSelectedUserIds(userIds);
    }

    setIsSubmitting(false);
  }, [open, isCreate, isEdit, isView, template, reset]);

  /* ------------------------------
     Submit
  ------------------------------ */
  const onSubmit = (data) => {
    // Convert selected user IDs array to comma-separated string
    data.users = selectedUserIds.join(',');
    data.id = undefined;

    setIsSubmitting(true);
    onSave?.(data).finally(() => setIsSubmitting(false));
  };

  // Handle user mapping save
  const handleUserMappingSave = (userIds) => {
    setSelectedUserIds(userIds);
  };

  // Get selected user names for display
  const getSelectedUserNames = () => {
    if (!selectedUserIds.length) return 'No users selected';
    // Ensure user.id is string for comparison
    const selectedUsers = users.filter(u => selectedUserIds.includes(String(u.id)));
    if (selectedUsers.length === 0) return 'No users selected';
    if (selectedUsers.length <= 3) {
      return selectedUsers.map(u => u.name).join(', ');
    }
    return `${selectedUsers.slice(0, 3).map(u => u.name).join(', ')} and ${selectedUsers.length - 3} more`;
  };
  console.log(selectedUserIds,"selectedUserIds");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            <span className="block pb-3 mb-4 border-b border-gray-300">
              {isCreate ? 'Create' : isEdit ? 'Edit' : 'View'} Modbus Template
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">

          {/* Template + Drive */}
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                isView ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50">
                      {field.value || '-'}
                    </div>
                  </div>
                ) : (
                  <Input {...field} placeholder="Template Name" />
                )
              )}
            />

            <Controller
              name="driveCode"
              control={control}
              render={({ field }) => (
                isView ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Drive Code</label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50">
                      {field.value || '-'}
                    </div>
                  </div>
                ) : (
                  <Input {...field} placeholder="Drive Code" />
                )
              )}
            />
          </div>
          {/*Customer Field */}
          <Controller
            name="orgCode"
            control={control}
            render={({ field }) => (
              isView ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50">
                    {customers.find(c => c.orgCode === field.value)?.name || 'No customer selected'}
                  </div>
                </div>
              ) : (
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="">Select customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.orgCode}>{c.name}</option>
                  ))}
                </select>
              )
            )}
          />

          {/* Parameters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parameters</label>
            <Controller
              name="parameters"
              control={control}
              render={({ field }) => (
                isView ? (
                  <pre className="w-full border border-gray-300 rounded p-3 bg-gray-50 overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                    {field.value || 'No parameters defined'}
                  </pre>
                ) : (
                  <textarea
                    {...field}
                    placeholder="Enter parameters (JSON format)"
                    className="w-full min-h-80 border border-gray-300 rounded p-2 font-mono text-sm"
                  />
                )
              )}
            />
          </div>
          {/* User Mapping Section */}
          <div className="border border-gray-300 rounded p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-700">User Access Mapping</h3>
              <span className="text-sm text-gray-500">
                {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
              </span>
            </div>

            <div className="space-y-3">
              {isView ? (
                <div className="bg-white p-3 rounded border border-gray-300">
                  <p className="text-sm font-medium text-gray-700 mb-2">Mapped Users:</p>
                  {selectedUserIds.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No users mapped</p>
                  ) : (
                    <ul className="space-y-1">
                      {users
                        .filter(u => selectedUserIds.includes(String(u.id)))
                        .map(user => (
                          <li key={user.id} className="text-sm text-gray-600">
                            • {user.name} {user.email && `(${user.email})`}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              ) : (
                <>
                  <div className="text-sm text-gray-600 bg-white p-3 rounded border border-gray-300 min-h-[60px]">
                    {getSelectedUserNames()}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setUserMappingOpen(true)}
                    className="w-full"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Manage User Mapping
                  </Button>
                </>
              )}
            </div>
          </div>



          {(isEdit || isCreate) && (
            <div className="flex justify-end">
              <Button type="submit" disabled={disableSave || isSubmitting}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          )}
        </form>

        {/* User Mapping Modal */}
        <UserMappingModal
          open={userMappingOpen}
          onOpenChange={setUserMappingOpen}
          users={users}
          selectedUserIds={selectedUserIds}
          onSave={handleUserMappingSave}
          disabled={isView}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ModbusTemplateModal;
