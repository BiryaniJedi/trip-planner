import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TYPE_LABELS } from '../utils';

export default function Home() {
	const navigate = useNavigate();
	return (
		<div>
			<h1>Hello World!</h1>
			<button onClick={() => navigate('/trips')}>View Trips</button>
		</div>
	);
}
