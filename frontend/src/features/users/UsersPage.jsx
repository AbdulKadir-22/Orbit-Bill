import { useState, useEffect } from 'react';
import { STRINGS } from '../../constants/strings';
import { userService } from './services/userService';
import { UserList } from './components/UserList';
import { UserForm } from './components/UserForm';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { UserPlus, AlertTriangle, ShieldCheck, Sun, Moon } from 'lucide-react';

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: string }

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return (
      localStorage.getItem('flux-theme') === 'dark' ||
      (!('flux-theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('flux-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('flux-theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  // Notification Banner Timeout
  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback((current) => (current?.text === text ? null : current));
    }, 4500);
  };

  // Fetch Users
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (err) {
      showFeedback('error', err.message || STRINGS.MSG_FETCH_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await userService.getAllUsers();
        if (!ignore) {
          setUsers(data);
        }
      } catch (err) {
        if (!ignore) {
          setFeedback({ type: 'error', text: err.message || STRINGS.MSG_FETCH_ERROR });
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, []);

  // Form Handlers
  const handleOpenCreate = () => {
    setSelectedUser(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    if (isSubmitting) return;
    setIsFormModalOpen(false);
    setSelectedUser(null);
  };

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (selectedUser) {
        await userService.updateUser(selectedUser._id, formData);
        showFeedback('success', STRINGS.MSG_USER_UPDATED_SUCCESS);
      } else {
        await userService.createUser(formData);
        showFeedback('success', STRINGS.MSG_USER_CREATED_SUCCESS);
      }
      setIsFormModalOpen(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (err) {
      showFeedback('error', err.message || STRINGS.MSG_NETWORK_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handlers
  const handlePromptDelete = (user) => {
    setUserToDelete(user);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    try {
      await userService.deleteUser(userToDelete._id);
      showFeedback('success', STRINGS.MSG_USER_DELETED_SUCCESS);
      setUserToDelete(null);
      await loadUsers();
    } catch (err) {
      showFeedback('error', err.message || STRINGS.MSG_NETWORK_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between selection:bg-ink selection:text-surface">
      {/* Top Bar / Header */}
      <header className="border-b-2 border-border bg-surface-card sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-ink text-surface font-mono font-bold flex items-center justify-center border-2 border-border text-sm shadow-[2px_2px_0px_var(--color-border)]">
              FL
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-xl tracking-tight text-ink flex items-center gap-2">
                <span>{STRINGS.APP_TITLE}</span>
              </h1>
              <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest hidden sm:block">
                {STRINGS.APP_SUBTITLE}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleTheme}
              title={STRINGS.THEME_TOOLTIP}
              className="px-2.5"
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
              <span className="hidden sm:inline">
                {isDarkMode ? STRINGS.THEME_TOGGLE_LIGHT : STRINGS.THEME_TOGGLE_DARK}
              </span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
            >
              <UserPlus size={14} />
              <span>{STRINGS.BTN_ADD_USER}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col gap-6">
        {/* Feedback Alert Toast */}
        {feedback && (
          <div
            role="alert"
            className={`brutal-card p-4 flex items-center justify-between gap-3 font-mono text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-2 duration-200 ${
              feedback.type === 'error'
                ? 'bg-red-50 text-red-900 border-red-900 dark:bg-red-950/70 dark:text-red-200 dark:border-red-500'
                : 'bg-emerald-50 text-emerald-950 border-emerald-950 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'error' ? (
                <AlertTriangle size={16} className="shrink-0" />
              ) : (
                <ShieldCheck size={16} className="shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="underline hover:no-underline cursor-pointer"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* Directory Header Bar */}
        <div className="flex items-end justify-between border-b-2 border-border pb-3">
          <div>
            <span className="font-mono text-xs font-bold text-ink-muted uppercase tracking-widest">
              MANAGEMENT CONSOLE
            </span>
            <h2 className="font-heading font-extrabold text-2xl text-ink tracking-tight">
              {STRINGS.USERS_DIRECTORY_TITLE}
            </h2>
          </div>
          <Badge variant="primary" className="text-xs">
            {STRINGS.USERS_DIRECTORY_COUNT(users.length)}
          </Badge>
        </div>

        {/* User List Component */}
        <UserList
          users={users}
          isLoading={isLoading}
          onEdit={handleOpenEdit}
          onDelete={handlePromptDelete}
          onRefresh={loadUsers}
        />
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-border bg-surface-card py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-ink-muted">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block animate-pulse" />
            <span>{STRINGS.STATUS_SERVER_ONLINE}</span>
          </div>
          <p>{STRINGS.FOOTER_COPYRIGHT}</p>
          <span>{STRINGS.APP_VERSION}</span>
        </div>
      </footer>

      {/* Modal: Create / Edit User */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedUser ? STRINGS.FORM_EDIT_TITLE : STRINGS.FORM_CREATE_TITLE}
      >
        {isFormModalOpen && (
          <UserForm
            key={selectedUser ? selectedUser._id : 'new'}
            initialData={selectedUser}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseFormModal}
            isSubmitting={isSubmitting}
          />
        )}
      </Modal>

      {/* Modal: Delete Confirmation */}
      <Modal
        isOpen={Boolean(userToDelete)}
        onClose={() => !isSubmitting && setUserToDelete(null)}
        title={STRINGS.DELETE_MODAL_TITLE}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-muted">
            {STRINGS.DELETE_MODAL_WARNING}
          </p>
          {userToDelete && (
            <div className="p-3 bg-surface border border-border font-mono text-xs text-ink">
              <p className="font-bold">{userToDelete.name}</p>
              <p className="text-ink-muted">{userToDelete.email}</p>
            </div>
          )}
          <p className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
            {STRINGS.DELETE_MODAL_PROMPT}
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              variant="secondary"
              onClick={() => setUserToDelete(null)}
              disabled={isSubmitting}
            >
              {STRINGS.BTN_CANCEL}
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
            >
              {STRINGS.BTN_CONFIRM_DELETE}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
