import axios from 'axios';

import { BACKEND_BASE_URL } from '../constants';

export default async function FormSubmit({
  rating,
  feedback,
}: {
  rating: number;
  feedback: string;
}): Promise<void> {
  const url = `${BACKEND_BASE_URL}/feedback`;
  await axios({
    method: 'post',
    url,
    data: {
      rating,
      feedback,
    },
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
  });
}
