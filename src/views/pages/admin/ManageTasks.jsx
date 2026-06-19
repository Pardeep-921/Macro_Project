// src/views/pages/admin/ManageTasks.jsx
import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { useCRMController } from '../../../controllers/CRMController';

export default function ManageTasks() {
    const { tasks, loading, handleCreateTask } = useCRMController();
    const [formData, setFormData] = useState({ title: '', description: '', dueDate: '' });
    const openTasks = tasks.filter(task => task.status !== 'Completed').length;
    const datedTasks = tasks.filter(task => task.dueDate).length;

    const onSubmit = async (e) => {
        e.preventDefault();
        const res = await handleCreateTask(formData);
        if (res.success) {
            setFormData({ title: '', description: '', dueDate: '' });
        } else {
            alert(res.message);
        }
    };

    return (
        <div className="crm-page">
            <PageHeader title="Task Management" />
            <div className="crm-shell">
                <div className="crm-summary-grid">
                    <article className="crm-summary-card tone-orange">
                        <span>Total Tasks</span>
                        <strong>{tasks.length}</strong>
                    </article>
                    <article className="crm-summary-card tone-info">
                        <span>Open Tasks</span>
                        <strong>{openTasks}</strong>
                    </article>
                    <article className="crm-summary-card tone-success">
                        <span>Scheduled</span>
                        <strong>{datedTasks}</strong>
                    </article>
                </div>

                <section className="crm-panel">
                    <div className="crm-panel-heading">
                        <div>
                            <span className="crm-kicker">Task Entry</span>
                            <h2>Add New Task</h2>
                        </div>
                    </div>
                    <form className="crm-form" onSubmit={onSubmit}>
                        <div className="form-grid crm-form-grid">
                            <div className="form-group">
                                <label>Task Title</label>
                                <input 
                                    className="responsive-input" 
                                    value={formData.title} 
                                    onChange={e => setFormData({...formData, title: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Due Date</label>
                                <input 
                                    type="date" 
                                    className="responsive-input" 
                                    value={formData.dueDate} 
                                    onChange={e => setFormData({...formData, dueDate: e.target.value})} 
                                />
                            </div>
                            <div className="form-group full-width">
                                <label>Description</label>
                                <textarea 
                                    className="responsive-input" 
                                    value={formData.description} 
                                    onChange={e => setFormData({...formData, description: e.target.value})} 
                                />
                            </div>
                        </div>
                        <div className="crm-actions">
                            <button type="submit" className="btn btn-primary">Create Task</button>
                        </div>
                    </form>
                </section>

                <section className="crm-panel">
                    <div className="crm-panel-heading">
                        <div>
                            <span className="crm-kicker">Work List</span>
                            <h2>My Tasks</h2>
                        </div>
                        <span className="crm-count">{tasks.length} Records</span>
                    </div>
                    {loading ? <div className="crm-loading">Loading tasks...</div> : tasks.length === 0 ? <div className="crm-empty">No tasks found.</div> : (
                        <div className="crm-task-list">
                            {tasks.map(task => (
                                <article key={task.id} className="crm-task-card">
                                    <div className="crm-task-main">
                                        <h3>{task.title}</h3>
                                        <p>{task.description || 'No description added.'}</p>
                                    </div>
                                    <div className="crm-task-meta">
                                        <div className="badge badge-pending">{task.status}</div>
                                        <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
