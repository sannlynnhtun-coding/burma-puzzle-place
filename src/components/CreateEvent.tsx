import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';

type PrizeInput = {
  name: string;
  value: number;
  isBlank: boolean;
};

type CreateEventProps = {
  onBack: () => void;
  onSuccess: () => void;
};

export default function CreateEvent({ onBack, onSuccess }: CreateEventProps) {
  const { user } = useAuth();
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [prizes, setPrizes] = useState<PrizeInput[]>([
    { name: '', value: 0, isBlank: false },
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const addPrize = () => {
    setPrizes([...prizes, { name: '', value: 0, isBlank: false }]);
  };

  const removePrize = (index: number) => {
    if (prizes.length > 1) {
      setPrizes(prizes.filter((_, i) => i !== index));
    }
  };

  const updatePrize = (index: number, field: keyof PrizeInput, value: string | number | boolean) => {
    const updated = [...prizes];
    updated[index] = { ...updated[index], [field]: value };
    setPrizes(updated);
  };

  const validatePrizes = (): boolean => {
    if (prizes.length < 5) {
      setError('You must have at least 5 prizes');
      return false;
    }

    const hasNonBlank = prizes.some((p) => !p.isBlank && p.value > 0);
    if (!hasNonBlank) {
      setError('You must have at least 1 real prize with value greater than 0');
      return false;
    }

    const hasEmptyNames = prizes.some((p) => !p.name.trim());
    if (hasEmptyNames) {
      setError('All prizes must have a name');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePrizes()) return;

    if (!user) {
      setError('You must be logged in');
      return;
    }

    setLoading(true);

    try {
      const sortedPrizes = [...prizes].sort((a, b) => b.value - a.value);

      const { data: eventData, error: eventError } = await supabase
        .from('game_events')
        .insert({
          creator_id: user.id,
          event_name: eventName,
          description: description,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      const prizesWithOrder = sortedPrizes.map((prize, index) => ({
        event_id: eventData.id,
        name: prize.name,
        value: prize.isBlank ? 0 : prize.value,
        is_blank: prize.isBlank,
        sort_order: index,
      }));

      const { error: prizeError } = await supabase.from('prize_pool').insert(prizesWithOrder);

      if (prizeError) throw prizeError;

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Create Game Event</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-2">
                Event Name
              </label>
              <input
                id="eventName"
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Prizes (Sorted Highest to Lowest Value)
                </label>
                <button
                  type="button"
                  onClick={addPrize}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition"
                >
                  <Plus size={20} />
                  Add Prize
                </button>
              </div>

              <div className="space-y-4">
                {prizes.map((prize, index) => (
                  <div
                    key={index}
                    className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Prize name"
                        value={prize.name}
                        onChange={(e) => updatePrize(index, 'name', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Value"
                        value={prize.value}
                        onChange={(e) => updatePrize(index, 'value', parseFloat(e.target.value) || 0)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        disabled={prize.isBlank}
                        required
                      />
                      <label className="flex items-center gap-2 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={prize.isBlank}
                          onChange={(e) => {
                            updatePrize(index, 'isBlank', e.target.checked);
                            if (e.target.checked) {
                              updatePrize(index, 'value', 0);
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Joke/Blank</span>
                      </label>
                    </div>
                    {prizes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePrize(index)}
                        className="text-red-600 hover:text-red-700 transition mt-2"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-600 mt-3">
                Minimum 5 prizes required. At least 1 must be a real prize with value {'>'} 0.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Event...' : 'Create Event'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
