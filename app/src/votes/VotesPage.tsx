import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useQuery, getSubmissionGroupById, getSubmissionCountForGroup, createSubmissionGroup, getAllSubmissionGroups } from 'wasp/client/operations';
import { SubmissionGroup } from 'wasp/entities';
// import { Submission, SubmissionGroup } from './utils';
export default function SubmissionPage() {
    const [filter, setFilter] = useState('');
    const [sort, setSort] = useState('');
    const [sortDescending, setSortDescending] = useState(false);
    const [showCompleted, setShowCompleted] = useState(false);
    const [showJudged, setShowJudged] = useState(false);
    const { data: submissionGroups, isLoading } = useQuery(getAllSubmissionGroups);
    const [_, setSubmissionGroups] = useState<SubmissionGroup[]>([]);
    const navigate = useNavigate();


    // Helper component to fetch submission count
    function SubmissionCount({ groupId }: { groupId: string }) {
        const { data } = useQuery(getSubmissionCountForGroup, { groupId });
        console.log(`Submission count for group ${groupId}: ${data}`);
        return <span>{data ?? 0}</span>;
    }


    const filteredGroups = () => submissionGroups!.filter(group => {
        const matchesFilter = group.title.toLowerCase().includes(filter.toLowerCase());
        const matchesCompleted = !showCompleted || group.isCompleted;
        const matchesJudged = !showJudged || group.isJudged;
        return matchesFilter && matchesCompleted && matchesJudged;
    });

    const sortedGroups = () => [...filteredGroups()!].sort((a, b) => {
        let comparison = 0;
        if (sort === 'name') {
            comparison = a.title.localeCompare(b.title);
        } else if (sort === 'date') {
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return sortDescending ? -comparison : comparison;
    });

    const handleAddGroup = async () => {
        const newGroup = await createSubmissionGroup(
            {
                title: `Group ${submissionGroups!.length + 1}`,
                description: ''
            }
        );

        setSubmissionGroups([...submissionGroups!, newGroup]);
    };




    return (
        <div className='py-10 lg:mt-10'>
            <div className='max-w-3xl mx-auto'>
                <h1 className='text-3xl font-bold text-center'>Submission</h1>
                <div className='my-4'>
                    <input
                        type='text'
                        placeholder='Filter by group name'
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className='border p-2 w-full'
                    />
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className='border p-2 w-full mt-2'
                    >
                        <option value=''>Sort by</option>
                        <option value='name'>Name</option>
                        <option value='date'>Date Created</option>
                    </select>
                    <label className='block mt-2'>
                        <input
                            type='checkbox'
                            checked={sortDescending}
                            onChange={(e) => setSortDescending(e.target.checked)}
                        />
                        Sort Descending
                    </label>
                    <div className='flex gap-4 mt-2'>
                        <label>
                            <input
                                type='checkbox'
                                checked={showCompleted}
                                onChange={(e) => setShowCompleted(e.target.checked)}
                            />
                            Show Completed
                        </label>
                        <label>
                            <input
                                type='checkbox'
                                checked={showJudged}
                                onChange={(e) => setShowJudged(e.target.checked)}
                            />
                            Show Judged
                        </label>
                    </div>
                    <button onClick={handleAddGroup} className='border p-2 mt-4'>Add Submission Group</button>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {!isLoading && (
                            sortedGroups().map(group => (
                                <div
                                    key={group.id}
                                    className='border p-4 cursor-pointer'
                                    onClick={() => navigate(`/vote/${group.id}`)}
                                >
                                    <p><SubmissionCount groupId={group.id} /> submissions</p>
                                    <p>{group.isCompleted ? 'Completed' : 'Not Completed'}</p>
                                    <p>{group.isJudged ? 'Judged' : 'Not Judged'}</p>
                                    <p>Created At: {new Date(group.createdAt).toLocaleDateString()}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
