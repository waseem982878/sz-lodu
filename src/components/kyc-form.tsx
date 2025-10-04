import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const KYCForm = () => {
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [documentType, setDocumentType] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (!user || !file || !documentType) {
            setError('Please select a file and document type.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);

        try {
            const idToken = await user.getIdToken();
            const response = await fetch('/api/kyc', {
                method: 'POST',
                headers: {
                    'Authorization': idToken,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            setMessage('KYC document submitted successfully. Please wait for approval.');
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10">
            <h2 className="text-2xl font-bold mb-4">Submit KYC</h2>
            <form onSubmit={handleSubmit}>
                 <div className="mb-4">
                    <Select onValueChange={setDocumentType} value={documentType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Document Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="aadhar">Aadhar Card</SelectItem>
                            <SelectItem value="pan">PAN Card</SelectItem>
                            <SelectItem value="passport">Passport</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="mb-4">
                    <Input type="file" onChange={handleFileChange} required />
                </div>
                <Button type="submit" className="w-full">Submit KYC</Button>
            </form>
            {error && <p className="text-red-500 mt-4">{error}</p>}
            {message && <p className="text-green-500 mt-4">{message}</p>}
        </div>
    );
};

export default KYCForm;
